<?php

namespace App\Controller;

use App\Entity\UserResourceProgress;
use App\Repository\ResourceRepository;
use App\Repository\UserResourceProgressRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use App\Entity\User;

#[Route('/api/user-resources')]
class ProgressController extends AbstractController
{
    // GET /api/user-resources/{resourceId}/progress
    #[Route('/{resourceId}/progress', name: 'api_progress_get', methods: ['GET'])]
    public function get(
        int $resourceId,
        #[CurrentUser] User $user,
        ResourceRepository $resourceRepository,
        UserResourceProgressRepository $progressRepository
    ): JsonResponse {
        $resource = $resourceRepository->find($resourceId);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $progress = $progressRepository->findOneBy(['user' => $user, 'resource' => $resource]);

        return $this->json([
            'resourceId' => $resourceId,
            'progress'   => $progress?->getProgress() ?? 0,
            'exploited'  => $progress?->isExploited() ?? false,
            'exploitedAt'=> $progress?->getExploitedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    // PATCH /api/user-resources/{resourceId}/progress
    #[Route('/{resourceId}/progress', name: 'api_progress_update', methods: ['PATCH'])]
    public function update(
        int $resourceId,
        Request $request,
        #[CurrentUser] User $user,
        ResourceRepository $resourceRepository,
        UserResourceProgressRepository $progressRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($resourceId);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        $progress = $progressRepository->findOneBy(['user' => $user, 'resource' => $resource]);
        if (!$progress) {
            $progress = new UserResourceProgress();
            $progress->setUser($user);
            $progress->setResource($resource);
            $em->persist($progress);
        }

        if (isset($data['progress'])) {
            $progress->setProgress((int) $data['progress']);
        }
        if (isset($data['exploited'])) {
            $progress->setExploited((bool) $data['exploited']);
        }

        $em->flush();

        return $this->json([
            'resourceId' => $resourceId,
            'progress'   => $progress->getProgress(),
            'exploited'  => $progress->isExploited(),
            'exploitedAt'=> $progress->getExploitedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    // GET /api/user-resources/exploited — ressources exploitées
    #[Route('/exploited', name: 'api_exploited_list', methods: ['GET'])]
    public function exploited(
        #[CurrentUser] User $user,
        UserResourceProgressRepository $progressRepository
    ): JsonResponse {
        $items = $progressRepository->findBy(['user' => $user, 'exploited' => true]);

        $data = array_map(fn(UserResourceProgress $p) => [
            'resourceId'  => $p->getResource()?->getId(),
            'description' => $p->getResource()?->getDescription(),
            'type'        => $p->getResource()?->getType()?->value,
            'progress'    => $p->getProgress(),
            'exploitedAt' => $p->getExploitedAt()?->format('Y-m-d H:i:s'),
        ], $items);

        return $this->json($data);
    }
}
