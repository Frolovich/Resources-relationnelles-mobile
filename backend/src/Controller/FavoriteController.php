<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\FavoriteService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Contrôleur : reçoit les requêtes HTTP sur /api/favorites et retourne les réponses JSON.
 * Toute la logique métier est déléguée au FavoriteService.
 */
#[Route('/api/favorites')]
class FavoriteController extends AbstractController
{
    public function __construct(private FavoriteService $favoriteService) {}

    // GET /api/favorites
    #[Route('', name: 'api_favorites_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json($this->favoriteService->getUserFavorites($user));
    }

    // POST /api/favorites/{resourceId}
    #[Route('/{resourceId}', name: 'api_favorites_add', methods: ['POST'])]
    public function add(int $resourceId, #[CurrentUser] User $user): JsonResponse
    {
        $result = $this->favoriteService->add($resourceId, $user);

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }

        return $this->json(
            ['message' => 'Added to favorites.', 'id' => $result['favorite']->getId()],
            Response::HTTP_CREATED
        );
    }

    // DELETE /api/favorites/{resourceId}
    #[Route('/{resourceId}', name: 'api_favorites_remove', methods: ['DELETE'])]
    public function remove(int $resourceId, #[CurrentUser] User $user): JsonResponse
    {
        $result = $this->favoriteService->remove($resourceId, $user);

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }

        return $this->json(['message' => 'Removed from favorites.']);
    }
}
