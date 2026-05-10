<?php

namespace App\Controller;

use App\Entity\Favorite;
use App\Repository\FavoriteRepository;
use App\Repository\ResourceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

#[Route('/api/favorites')]
class FavoriteController extends AbstractController
{
    // GET /api/favorites — liste des favoris de l'utilisateur connecté
    #[Route('', name: 'api_favorites_list', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        FavoriteRepository $favoriteRepository
    ): JsonResponse {
        $favorites = $favoriteRepository->findBy(['user' => $user]);

        $data = array_map(fn(Favorite $f) => [
            'id'         => $f->getId(),
            'resourceId' => $f->getResource()?->getId(),
            'title'      => $f->getResource()?->getDescription(),
            'type'       => $f->getResource()?->getType()?->value,
            'status'     => $f->getResource()?->getStatus()?->value,
            'createdAt'  => $f->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $favorites);

        return $this->json($data);
    }

    // POST /api/favorites/{resourceId} — ajouter aux favoris
    #[Route('/{resourceId}', name: 'api_favorites_add', methods: ['POST'])]
    public function add(
        int $resourceId,
        #[CurrentUser] User $user,
        ResourceRepository $resourceRepository,
        FavoriteRepository $favoriteRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($resourceId);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier si déjà en favori
        $existing = $favoriteRepository->findOneBy(['user' => $user, 'resource' => $resource]);
        if ($existing) {
            return $this->json(['error' => 'Already in favorites.'], Response::HTTP_CONFLICT);
        }

        $favorite = new Favorite();
        $favorite->setUser($user);
        $favorite->setResource($resource);

        // Incrémenter le compteur
        $resource->setFavori($resource->getFavori() + 1);

        $em->persist($favorite);
        $em->flush();

        return $this->json(['message' => 'Added to favorites.', 'id' => $favorite->getId()], Response::HTTP_CREATED);
    }

    // DELETE /api/favorites/{resourceId} — retirer des favoris
    #[Route('/{resourceId}', name: 'api_favorites_remove', methods: ['DELETE'])]
    public function remove(
        int $resourceId,
        #[CurrentUser] User $user,
        ResourceRepository $resourceRepository,
        FavoriteRepository $favoriteRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($resourceId);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $favorite = $favoriteRepository->findOneBy(['user' => $user, 'resource' => $resource]);
        if (!$favorite) {
            return $this->json(['error' => 'Not in favorites.'], Response::HTTP_NOT_FOUND);
        }

        // Décrémenter le compteur
        $resource->setFavori(max(0, $resource->getFavori() - 1));

        $em->remove($favorite);
        $em->flush();

        return $this->json(['message' => 'Removed from favorites.'], Response::HTTP_OK);
    }
}
