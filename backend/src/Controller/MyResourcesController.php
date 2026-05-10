<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\ResourceRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class MyResourcesController extends AbstractController
{
    #[Route('/api/my-resources', name: 'api_my_resources', methods: ['GET'])]
    public function list(
        #[CurrentUser] User $user,
        ResourceRepository $resourceRepository
    ): JsonResponse {
        $resources = $resourceRepository->findBy(
            ['user' => $user],
            ['dateCreation' => 'DESC']
        );

        $data = array_map(fn($r) => [
            'id'          => $r->getId(),
            'description' => $r->getDescription(),
            'type'        => $r->getType()?->value,
            'status'      => $r->getStatus()?->value,
            'category'    => $r->getCategory()?->getName(),
            'categoryId'  => $r->getCategory()?->getId(),
            'content'     => $r->getContent(),
            'restreint'   => $r->isRestreint(),
            'favori'      => $r->getFavori(),
            'saved'       => $r->getSaved(),
            'popular'     => $r->getPopular(),
            'views'       => $r->getStatistique()?->getViews() ?? 0,
            'dateCreation'=> $r->getDateCreation()?->format('Y-m-d'),
            'datePublication' => $r->getDatePublication()?->format('Y-m-d'),
        ], $resources);

        return $this->json($data);
    }
}
