<?php

namespace App\Controller;

use App\Entity\CommentStatus;
use App\Entity\ModerationLog;
use App\Entity\ResourceStatus;
use App\Repository\CommentRepository;
use App\Repository\ResourceRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

#[Route('/api/moderation')]
class ModerationController extends AbstractController
{
    // GET /api/moderation/resources — ressources en attente
    #[Route('/resources', name: 'api_moderation_resources', methods: ['GET'])]
    public function pendingResources(ResourceRepository $resourceRepository): JsonResponse
    {
        $resources = $resourceRepository->findBy(
            ['status' => ResourceStatus::PENDING],
            ['dateCreation' => 'ASC']
        );

        $data = array_map(fn($r) => [
            'id'          => $r->getId(),
            'description' => $r->getDescription(),
            'type'        => $r->getType()?->value,
            'content'     => $r->getContent(),
            'category'    => $r->getCategory()?->getName(),
            'author'      => $r->getUser()?->getEmail(),
            'createdAt'   => $r->getDateCreation()?->format('Y-m-d H:i:s'),
        ], $resources);

        return $this->json($data);
    }

    // PATCH /api/moderation/resources/{id}/approve
    #[Route('/resources/{id}/approve', name: 'api_moderation_approve_resource', methods: ['PATCH'])]
    public function approveResource(
        int $id,
        #[CurrentUser] User $moderator,
        ResourceRepository $resourceRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($id);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $resource->setStatus(ResourceStatus::APPROVED);
        $resource->setDatePublication(new \DateTime());

        $log = new ModerationLog();
        $log->setModerator($moderator);
        $log->setAction('approve_resource');
        $log->setResource($resource);

        $em->persist($log);
        $em->flush();

        return $this->json(['message' => 'Resource approved.']);
    }

    // PATCH /api/moderation/resources/{id}/refuse
    #[Route('/resources/{id}/refuse', name: 'api_moderation_refuse_resource', methods: ['PATCH'])]
    public function refuseResource(
        int $id,
        Request $request,
        #[CurrentUser] User $moderator,
        ResourceRepository $resourceRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($id);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $data   = json_decode($request->getContent(), true);
        $reason = $data['reason'] ?? 'Non conforme';

        $resource->setStatus(ResourceStatus::REJECTED);

        $log = new ModerationLog();
        $log->setModerator($moderator);
        $log->setAction('refuse_resource');
        $log->setResource($resource);
        $log->setReason($reason);

        $em->persist($log);
        $em->flush();

        return $this->json(['message' => 'Resource refused.']);
    }

    // GET /api/moderation/comments — commentaires en attente
    #[Route('/comments', name: 'api_moderation_comments', methods: ['GET'])]
    public function pendingComments(CommentRepository $commentRepository): JsonResponse
    {
        $comments = $commentRepository->findBy(
            ['status' => CommentStatus::PENDING],
            ['date' => 'ASC']
        );

        $data = array_map(fn($c) => [
            'id'         => $c->getId(),
            'content'    => $c->getContent(),
            'author'     => $c->getUser()?->getEmail(),
            'resourceId' => $c->getResource()?->getId(),
            'date'       => $c->getDate()?->format('Y-m-d H:i:s'),
        ], $comments);

        return $this->json($data);
    }

    // PATCH /api/moderation/comments/{id}/approve
    #[Route('/comments/{id}/approve', name: 'api_moderation_approve_comment', methods: ['PATCH'])]
    public function approveComment(
        int $id,
        #[CurrentUser] User $moderator,
        CommentRepository $commentRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $comment = $commentRepository->find($id);
        if (!$comment) {
            return $this->json(['error' => 'Comment not found.'], Response::HTTP_NOT_FOUND);
        }

        $comment->setStatus(CommentStatus::APPROVED);

        $log = new ModerationLog();
        $log->setModerator($moderator);
        $log->setAction('approve_comment');
        $log->setComment($comment);

        $em->persist($log);
        $em->flush();

        return $this->json(['message' => 'Comment approved.']);
    }

    // PATCH /api/moderation/comments/{id}/refuse
    #[Route('/comments/{id}/refuse', name: 'api_moderation_refuse_comment', methods: ['PATCH'])]
    public function refuseComment(
        int $id,
        Request $request,
        #[CurrentUser] User $moderator,
        CommentRepository $commentRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $comment = $commentRepository->find($id);
        if (!$comment) {
            return $this->json(['error' => 'Comment not found.'], Response::HTTP_NOT_FOUND);
        }

        $data   = json_decode($request->getContent(), true);
        $reason = $data['reason'] ?? 'Non conforme';

        $comment->setStatus(CommentStatus::REFUSED);

        $log = new ModerationLog();
        $log->setModerator($moderator);
        $log->setAction('refuse_comment');
        $log->setComment($comment);
        $log->setReason($reason);

        $em->persist($log);
        $em->flush();

        return $this->json(['message' => 'Comment refused.']);
    }

    // PATCH /api/moderation/users/{id}/suspend
    #[Route('/users/{id}/suspend', name: 'api_moderation_suspend_user', methods: ['PATCH'])]
    public function suspendUser(
        string $id,
        Request $request,
        #[CurrentUser] User $moderator,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $target = $userRepository->find($id);
        if (!$target) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        $data   = json_decode($request->getContent(), true);
        $reason = $data['reason'] ?? 'Comportement non conforme';

        $target->setStatus(false);

        $log = new ModerationLog();
        $log->setModerator($moderator);
        $log->setAction('suspend_user');
        $log->setTargetUser($target);
        $log->setReason($reason);

        $em->persist($log);
        $em->flush();

        return $this->json(['message' => 'User suspended.']);
    }
}
