<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserResourceProgress;
use App\Repository\ResourceRepository;
use App\Repository\UserResourceProgressRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Service : porte l'intelligence fonctionnelle de la progression utilisateur.
 */
class ProgressService
{
    public function __construct(
        private ResourceRepository $resourceRepository,
        private UserResourceProgressRepository $progressRepository,
        private EntityManagerInterface $em,
    ) {}

    public function getProgress(int $resourceId, User $user): array
    {
        $resource = $this->resourceRepository->find($resourceId);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        $progress = $this->progressRepository->findOneBy(['user' => $user, 'resource' => $resource]);

        return [
            'resourceId'  => $resourceId,
            'progress'    => $progress?->getProgress() ?? 0,
            'exploited'   => $progress?->isExploited() ?? false,
            'exploitedAt' => $progress?->getExploitedAt()?->format('Y-m-d H:i:s'),
        ];
    }

    public function updateProgress(int $resourceId, User $user, array $data): array
    {
        $resource = $this->resourceRepository->find($resourceId);
        if (!$resource) {
            return ['error' => 'Resource not found.', 'code' => 404];
        }

        $progress = $this->progressRepository->findOneBy(['user' => $user, 'resource' => $resource]);
        if (!$progress) {
            $progress = new UserResourceProgress();
            $progress->setUser($user);
            $progress->setResource($resource);
            $this->em->persist($progress);
        }

        if (isset($data['progress'])) { $progress->setProgress((int) $data['progress']); }
        if (isset($data['exploited'])) { $progress->setExploited((bool) $data['exploited']); }

        $this->em->flush();

        return [
            'resourceId'  => $resourceId,
            'progress'    => $progress->getProgress(),
            'exploited'   => $progress->isExploited(),
            'exploitedAt' => $progress->getExploitedAt()?->format('Y-m-d H:i:s'),
        ];
    }

    public function getExploited(User $user): array
    {
        $items = $this->progressRepository->findBy(['user' => $user, 'exploited' => true]);

        return array_map(fn(UserResourceProgress $p) => [
            'resourceId'  => $p->getResource()?->getId(),
            'description' => $p->getResource()?->getDescription(),
            'type'        => $p->getResource()?->getType()?->value,
            'progress'    => $p->getProgress(),
            'exploitedAt' => $p->getExploitedAt()?->format('Y-m-d H:i:s'),
        ], $items);
    }
}
