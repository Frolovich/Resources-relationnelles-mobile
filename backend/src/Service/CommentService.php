<?php

namespace App\Service;

use App\Entity\Comment;
use App\Entity\CommentStatus;
use App\Entity\User;
use App\Repository\ResourceRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service : porte l'intelligence fonctionnelle des commentaires.
 */
class CommentService
{
    public function __construct(
        private ResourceRepository $resourceRepository,
        private EntityManagerInterface $em,
    ) {}

    /**
     * @return array{comment: Comment}|array{error: string, code: int}
     */
    public function createComment(User $user, array $data): array
    {
        $content    = $data['content'] ?? null;
        $resourceId = $data['resourceId'] ?? null;

        // Support format IRI "/api/resources/1"
        if (!$resourceId && isset($data['resource'])) {
            preg_match('/(\d+)$/', $data['resource'], $matches);
            $resourceId = $matches[1] ?? null;
        }

        if (!$content || !$resourceId) {
            return ['error' => 'content and resourceId are required.', 'code' => 400];
        }

        $resource = $this->resourceRepository->find($resourceId);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        $comment = new Comment();
        $comment->setUser($user);
        $comment->setResource($resource);
        $comment->setContent($content);
        $comment->setStatus(CommentStatus::PENDING);

        $this->em->persist($comment);
        $this->em->flush();

        return ['comment' => $comment];
    }
}
