<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\CommentStatus;
use App\Entity\User;
use App\Repository\ResourceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class CommentController extends AbstractController
{
    #[Route('/api/comment/create', name: 'api_comments_create', methods: ['POST'])]
    public function create(
        Request $request,
        #[CurrentUser] ?User $user,
        ResourceRepository $resourceRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$user) {
            return $this->json(['error' => 'Not authenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $content    = $data['content'] ?? null;
        $resourceId = $data['resourceId'] ?? null;

        // Support format IRI "/api/resources/1"
        if (!$resourceId && isset($data['resource'])) {
            preg_match('/(\d+)$/', $data['resource'], $matches);
            $resourceId = $matches[1] ?? null;
        }

        if (!$content || !$resourceId) {
            return $this->json(['error' => 'content and resourceId are required.'], Response::HTTP_BAD_REQUEST);
        }

        $resource = $resourceRepository->find($resourceId);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $comment = new Comment();
        $comment->setUser($user);
        $comment->setResource($resource);
        $comment->setContent($content);
        $comment->setStatus(CommentStatus::PENDING);

        $em->persist($comment);
        $em->flush();

        return $this->json([
            'message' => 'Comment created, pending moderation.',
            'id'      => $comment->getId(),
        ], Response::HTTP_CREATED);
    }
}
