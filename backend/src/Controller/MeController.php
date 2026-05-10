<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;
use App\Repository\ResourceRepository;
use App\Repository\CommentRepository;
use App\Entity\ResourceStatus;
use App\Entity\CommentStatus;

class MeController extends AbstractController
{
    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(
        #[CurrentUser] ?User $user,
        ResourceRepository $resourceRepository,
        CommentRepository $commentRepository
    ): JsonResponse {
        if (!$user) {
            return $this->json(['error' => 'Not authenticated'], 401);
        }

        // Commentaires en attente sur les ressources de l'utilisateur
        $pendingComments = 0;
        foreach ($user->getResources() as $resource) {
            foreach ($resource->getComments() as $comment) {
                if ($comment->getStatus()->value === 'pending') {
                    $pendingComments++;
                }
            }
        }

        // Pour les modérateurs/admins : ressources et commentaires en attente de modération
        $roles = $user->getRoles();
        $isModerator = array_intersect(['ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'], $roles);

        $pendingResources = 0;
        $pendingModComments = 0;
        if ($isModerator) {
            $pendingResources   = count($resourceRepository->findBy(['status' => ResourceStatus::PENDING]));
            $pendingModComments = count($commentRepository->findBy(['status' => CommentStatus::PENDING]));
        }

        return $this->json([
            'id'                  => $user->getId(),
            'email'               => $user->getEmail(),
            'name'                => $user->getName(),
            'surname'             => $user->getSurname(),
            'nickname'            => $user->getNickname(),
            'city'                => $user->getCity(),
            'roles'               => $user->getRoles(),
            'registeredAt'        => $user->getRegisteredAt()?->format('Y-m-d H:i:s'),
            'birthdate'           => $user->getBirthdate()?->format('Y-m-d'),
            'pendingComments'     => $pendingComments,
            'pendingResources'    => $pendingResources,
            'pendingModComments'  => $pendingModComments,
        ]);
    }
}
