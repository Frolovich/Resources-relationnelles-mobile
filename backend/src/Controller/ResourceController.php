<?php

namespace App\Controller;

use App\Entity\ResourceStatus;
use App\Repository\CategoryRepository;
use App\Repository\ResourceRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/public/resources')]
class ResourceController extends AbstractController
{
    // GET /api/public/resources — liste publique des ressources publiées
    #[Route('', name: 'api_public_resources_list', methods: ['GET'])]
    public function list(
        Request $request,
        ResourceRepository $resourceRepository,
        CategoryRepository $categoryRepository
    ): JsonResponse {
        $search     = $request->query->get('search', '');
        $categoryId = $request->query->get('category');
        $type       = $request->query->get('type');
        $sort       = $request->query->get('sort', 'newest'); // newest | views

        $qb = $resourceRepository->createQueryBuilder('r')
            ->where('r.status = :status')
            ->andWhere('r.deletedAt IS NULL')
            ->setParameter('status', ResourceStatus::APPROVED);

        // Filtre contenu restreint — par défaut exclu pour les visiteurs
        $token = $request->headers->get('Authorization');
        if (!$token) {
            $qb->andWhere('r.restreint = false OR r.restreint IS NULL');
        }

        if ($search) {
            $qb->andWhere('r.description LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }

        if ($categoryId) {
            $qb->andWhere('r.category = :category')
               ->setParameter('category', (int) $categoryId);
        }

        if ($type) {
            $qb->andWhere('r.type = :type')
               ->setParameter('type', $type);
        }

        if ($sort === 'views') {
            $qb->leftJoin('r.statistique', 's')
               ->orderBy('s.views', 'DESC');
        } else {
            $qb->orderBy('r.dateCreation', 'DESC');
        }

        $resources = $qb->getQuery()->getResult();

        $data = array_map(fn($r) => [
            'id'              => $r->getId(),
            'description'     => $r->getDescription(),
            'content'         => $r->getContent(),
            'type'            => $r->getType()?->value,
            'category'        => $r->getCategory()?->getName(),
            'categoryId'      => $r->getCategory()?->getId(),
            'restreint'       => $r->isRestreint(),
            'favori'          => $r->getFavori(),
            'popular'         => $r->getPopular(),
            'datePublication' => $r->getDatePublication()?->format('Y-m-d'),
            'author'          => $r->getUser()?->getNickname() ?? $r->getUser()?->getName(),
            'views'           => $r->getStatistique()?->getViews() ?? 0,
        ], $resources);

        return $this->json($data);
    }

    // GET /api/public/resources/{id} — détail d'une ressource
    #[Route('/{id}', name: 'api_public_resource_show', methods: ['GET'])]
    public function show(
        int $id,
        Request $request,
        ResourceRepository $resourceRepository
    ): JsonResponse {
        $resource = $resourceRepository->find($id);

        if (!$resource || $resource->isDeleted()) {
            return $this->json(['error' => 'Resource not found.'], 404);
        }

        // Ressource restreinte sans token → rediriger
        $token = $request->headers->get('Authorization');
        if ($resource->isRestreint() && !$token) {
            return $this->json(['error' => 'Authentication required.', 'restricted' => true], 401);
        }

        // Incrémenter les vues
        $stat = $resource->getStatistique();
        if ($stat) {
            $stat->setViews($stat->getViews() + 1);
            $resourceRepository->getEntityManager()->flush();
        }

        // Commentaires approuvés
        $comments = array_filter(
            $resource->getComments()->toArray(),
            fn($c) => $c->getStatus()->value === 'approved'
        );

        return $this->json([
            'id'              => $resource->getId(),
            'description'     => $resource->getDescription(),
            'content'         => $resource->getContent(),
            'type'            => $resource->getType()?->value,
            'category'        => $resource->getCategory()?->getName(),
            'categoryId'      => $resource->getCategory()?->getId(),
            'restreint'       => $resource->isRestreint(),
            'status'          => $resource->getStatus()?->value,
            'favori'          => $resource->getFavori(),
            'popular'         => $resource->getPopular(),
            'dateCreation'    => $resource->getDateCreation()?->format('Y-m-d'),
            'datePublication' => $resource->getDatePublication()?->format('Y-m-d'),
            'author'          => $resource->getUser()?->getNickname() ?? $resource->getUser()?->getName(),
            'authorId'        => $resource->getUser()?->getId(),
            'views'           => $resource->getStatistique()?->getViews() ?? 0,
            'comments'        => array_values(array_map(fn($c) => [
                'id'      => $c->getId(),
                'content' => $c->getContent(),
                'author'  => $c->getUser()?->getNickname() ?? $c->getUser()?->getName(),
                'date'    => $c->getDate()?->format('Y-m-d H:i'),
            ], $comments)),
        ]);
    }
}
