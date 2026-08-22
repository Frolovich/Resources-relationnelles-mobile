<?php

namespace App\Service;

use App\Entity\Favorite;
use App\Entity\User;
use App\Repository\FavoriteRepository;
use App\Repository\ResourceRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service : porte l'intelligence fonctionnelle des favoris.
 * Vérifie les règles métier, gère les compteurs, persiste via EntityManager.
 */
class FavoriteService
{
    public function __construct(
        private FavoriteRepository $favoriteRepository,
        private ResourceRepository $resourceRepository,
        private EntityManagerInterface $em,
    ) {}

    /**
     * Retourne les favoris d'un utilisateur formatés pour la réponse JSON.
     */
    public function getUserFavorites(User $user): array
    {
        $favorites = $this->favoriteRepository->findByUser($user);

        return array_map(fn(Favorite $f) => [
            'id'         => $f->getId(),
            'resourceId' => $f->getResource()?->getId(),
            'title'      => $f->getResource()?->getDescription(),
            'type'       => $f->getResource()?->getType()?->value,
            'status'     => $f->getResource()?->getStatus()?->value,
            'createdAt'  => $f->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $favorites);
    }

    /**
     * Ajoute une ressource aux favoris de l'utilisateur.
     *
     * @return array{favorite: Favorite}|array{error: string, code: int}
     */
    public function add(int $resourceId, User $user): array
    {
        $resource = $this->resourceRepository->find($resourceId);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        if ($this->favoriteRepository->isAlreadyFavorite($user, $resourceId)) {
            return ['error' => 'Already in favorites.', 'code' => 409];
        }

        $favorite = new Favorite();
        $favorite->setUser($user);
        $favorite->setResource($resource);

        // Règle métier : incrémenter le compteur de favoris de la ressource
        $resource->setFavori($resource->getFavori() + 1);

        $this->em->persist($favorite);
        $this->em->flush();

        return ['favorite' => $favorite];
    }

    /**
     * Retire une ressource des favoris de l'utilisateur.
     *
     * @return array{success: true}|array{error: string, code: int}
     */
    public function remove(int $resourceId, User $user): array
    {
        $resource = $this->resourceRepository->find($resourceId);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        $favorite = $this->favoriteRepository->findOneBy([
            'user'     => $user,
            'resource' => $resource,
        ]);

        if (!$favorite) {
            return ['error' => 'Not in favorites.', 'code' => 404];
        }

        // Règle métier : décrémenter le compteur (minimum 0)
        $resource->setFavori(max(0, $resource->getFavori() - 1));

        $this->em->remove($favorite);
        $this->em->flush();

        return ['success' => true];
    }
}
