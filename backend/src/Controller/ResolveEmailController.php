<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ResolveEmailController extends AbstractController
{
    #[Route('/api/resolve-email', name: 'api_resolve_email', methods: ['GET'])]
    public function resolve(Request $request, UserRepository $userRepository): JsonResponse
    {
        $nickname = $request->query->get('nickname');

        if (!$nickname) {
            return $this->json(['error' => 'Nickname is required.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['nickname' => $nickname]);

        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['email' => $user->getEmail()]);
    }
}
