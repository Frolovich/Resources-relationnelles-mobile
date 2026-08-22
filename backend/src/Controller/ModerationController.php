<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\ModerationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Contrôleur : reçoit les requêtes HTTP sur /api/moderation et retourne les réponses JSON.
 * La logique métier est déléguée au ModerationService.
 */
#[Route('/api/moderation')]
class ModerationController extends AbstractController
{
    public function __construct(private ModerationService $moderationService) {}

    #[Route('/resources', name: 'api_moderation_resources', methods: ['GET'])]
    public function pendingResources(): JsonResponse
    {
        return $this->json($this->moderationService->getPendingResources());
    }

    #[Route('/resources/{id}/approve', name: 'api_moderation_approve_resource', methods: ['PATCH'])]
    public function approveResource(int $id, #[CurrentUser] User $moderator): JsonResponse
    {
        $result = $this->moderationService->approveResource($id, $moderator);
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }
        return $this->json(['message' => 'Resource approved.']);
    }

    #[Route('/resources/{id}/refuse', name: 'api_moderation_refuse_resource', methods: ['PATCH'])]
    public function refuseResource(int $id, Request $request, #[CurrentUser] User $moderator): JsonResponse
    {
        $data   = json_decode($request->getContent(), true);
        $result = $this->moderationService->refuseResource($id, $moderator, $data['reason'] ?? 'Non conforme');
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }
        return $this->json(['message' => 'Resource refused.']);
    }

    #[Route('/comments', name: 'api_moderation_comments', methods: ['GET'])]
    public function pendingComments(): JsonResponse
    {
        return $this->json($this->moderationService->getPendingComments());
    }

    #[Route('/comments/{id}/approve', name: 'api_moderation_approve_comment', methods: ['PATCH'])]
    public function approveComment(int $id, #[CurrentUser] User $moderator): JsonResponse
    {
        $result = $this->moderationService->approveComment($id, $moderator);
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }
        return $this->json(['message' => 'Comment approved.']);
    }

    #[Route('/comments/{id}/refuse', name: 'api_moderation_refuse_comment', methods: ['PATCH'])]
    public function refuseComment(int $id, Request $request, #[CurrentUser] User $moderator): JsonResponse
    {
        $data   = json_decode($request->getContent(), true);
        $result = $this->moderationService->refuseComment($id, $moderator, $data['reason'] ?? 'Non conforme');
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }
        return $this->json(['message' => 'Comment refused.']);
    }

    #[Route('/users/{id}/suspend', name: 'api_moderation_suspend_user', methods: ['PATCH'])]
    public function suspendUser(string $id, Request $request, #[CurrentUser] User $moderator): JsonResponse
    {
        $data   = json_decode($request->getContent(), true);
        $result = $this->moderationService->suspendUser($id, $moderator, $data['reason'] ?? 'Comportement non conforme');
        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], $result['code']);
        }
        return $this->json(['message' => 'User suspended.']);
    }
}
