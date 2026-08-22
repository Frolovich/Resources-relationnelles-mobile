<?php

namespace App\Service;

use App\Entity\CommentStatus;
use App\Entity\ModerationLog;
use App\Entity\ResourceStatus;
use App\Entity\User;
use App\Repository\CommentRepository;
use App\Repository\ResourceRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service : porte l'intelligence fonctionnelle de la modération.
 * Approbation, refus, suspension et journalisation des actions.
 */
class ModerationService
{
    public function __construct(
        private ResourceRepository $resourceRepository,
        private CommentRepository $commentRepository,
        private UserRepository $userRepository,
        private EntityManagerInterface $em,
    ) {}

    public function getPendingResources(): array
    {
        $resources = $this->resourceRepository->findBy(
            ['status' => ResourceStatus::PENDING],
            ['dateCreation' => 'ASC']
        );

        return array_map(fn($r) => [
            'id'          => $r->getId(),
            'description' => $r->getDescription(),
            'type'        => $r->getType()?->value,
            'content'     => $r->getContent(),
            'category'    => $r->getCategory()?->getName(),
            'author'      => $r->getUser()?->getEmail(),
            'createdAt'   => $r->getDateCreation()?->format('Y-m-d H:i:s'),
        ], $resources);
    }

    public function approveResource(int $id, User $moderator): array
    {
        $resource = $this->resourceRepository->find($id);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        $resource->setStatus(ResourceStatus::APPROVED);
        $resource->setDatePublication(new \DateTime());
        $this->log($moderator, 'approve_resource', resource: $resource);

        return ['success' => true];
    }

    public function refuseResource(int $id, User $moderator, string $reason): array
    {
        $resource = $this->resourceRepository->find($id);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        $resource->setStatus(ResourceStatus::REJECTED);
        $this->log($moderator, 'refuse_resource', resource: $resource, reason: $reason);

        return ['success' => true];
    }

    public function getPendingComments(): array
    {
        $comments = $this->commentRepository->findBy(
            ['status' => CommentStatus::PENDING],
            ['date' => 'ASC']
        );

        return array_map(fn($c) => [
            'id'         => $c->getId(),
            'content'    => $c->getContent(),
            'author'     => $c->getUser()?->getEmail(),
            'resourceId' => $c->getResource()?->getId(),
            'date'       => $c->getDate()?->format('Y-m-d H:i:s'),
        ], $comments);
    }

    public function approveComment(int $id, User $moderator): array
    {
        $comment = $this->commentRepository->find($id);
        if (!$comment) {
            return ['error' => 'Comment not found.', 'code' => 404];
        }

        $comment->setStatus(CommentStatus::APPROVED);
        $this->log($moderator, 'approve_comment', comment: $comment);

        return ['success' => true];
    }

    public function refuseComment(int $id, User $moderator, string $reason): array
    {
        $comment = $this->commentRepository->find($id);
        if (!$comment) {
            return ['error' => 'Comment not found.', 'code' => 404];
        }

        $comment->setStatus(CommentStatus::REFUSED);
        $this->log($moderator, 'refuse_comment', comment: $comment, reason: $reason);

        return ['success' => true];
    }

    public function suspendUser(string $id, User $moderator, string $reason): array
    {
        $target = $this->userRepository->find($id);
        if (!$target) {
            return ['error' => 'User not found.', 'code' => 404];
        }

        $target->setStatus(false);
        $this->log($moderator, 'suspend_user', targetUser: $target, reason: $reason);

        return ['success' => true];
    }

    private function log(
        User $moderator,
        string $action,
        mixed $resource = null,
        mixed $comment = null,
        mixed $targetUser = null,
        string $reason = ''
    ): void {
        $log = new ModerationLog();
        $log->setModerator($moderator);
        $log->setAction($action);
        if ($resource)   { $log->setResource($resource); }
        if ($comment)    { $log->setComment($comment); }
        if ($targetUser) { $log->setTargetUser($targetUser); }
        if ($reason)     { $log->setReason($reason); }

        $this->em->persist($log);
        $this->em->flush();
    }
}
