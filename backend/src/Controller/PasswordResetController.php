<?php

namespace App\Controller;

use App\Service\PasswordResetService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur : reçoit les requêtes HTTP sur /api/password et retourne les réponses JSON.
 * La logique métier est déléguée au PasswordResetService.
 */
class PasswordResetController extends AbstractController
{
    public function __construct(private PasswordResetService $passwordResetService) {}

    #[Route('/api/password/request', name: 'api_password_request', methods: ['POST'])]
    public function request(Request $request): JsonResponse
    {
        $data  = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->json(['error' => 'Email is required.'], Response::HTTP_BAD_REQUEST);
        }

        $result = $this->passwordResetService->requestReset($email);

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json([
            'message' => 'If this email exists, a reset link has been sent.',
            'sent'    => $result['sent'],
        ]);
    }

    #[Route('/api/password/reset', name: 'api_password_reset', methods: ['POST'])]
    public function reset(Request $request): JsonResponse
    {
        $data        = json_decode($request->getContent(), true);
        $token       = $data['token'] ?? null;
        $newPassword = $data['password'] ?? null;

        if (!$token || !$newPassword) {
            return $this->json(['error' => 'Token and password are required.'], Response::HTTP_BAD_REQUEST);
        }

        $result = $this->passwordResetService->resetPassword($token, $newPassword);

        if (isset($result['error'])) {
            return $this->json(['error' => $result['error']], Response::HTTP_BAD_REQUEST);
        }

        return $this->json(['message' => 'Password updated successfully. You can now log in.']);
    }
}
