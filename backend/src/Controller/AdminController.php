<?php

namespace App\Controller;

use App\Repository\CategoryRepository;
use App\Repository\ResourceRepository;
use App\Repository\StatistiqueRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    // GET /api/admin/users — liste des utilisateurs
    #[Route('/users', name: 'api_admin_users', methods: ['GET'])]
    public function users(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findAll();

        $data = array_map(fn($u) => [
            'id'           => $u->getId(),
            'email'        => $u->getEmail(),
            'name'         => $u->getName(),
            'surname'      => $u->getSurname(),
            'roles'        => $u->getRoles(),
            'status'       => $u->isStatus(),
            'registeredAt' => $u->getRegisteredAt()?->format('Y-m-d'),
        ], $users);

        return $this->json($data);
    }

    // PATCH /api/admin/users/{id}/toggle-status — activer/désactiver
    #[Route('/users/{id}/toggle-status', name: 'api_admin_toggle_user', methods: ['PATCH'])]
    public function toggleUser(
        string $id,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        $user->setStatus(!$user->isStatus());
        $em->flush();

        return $this->json(['status' => $user->isStatus()]);
    }

    // PATCH /api/admin/users/{id}/role — changer le rôle
    #[Route('/users/{id}/role', name: 'api_admin_change_role', methods: ['PATCH'])]
    public function changeRole(
        string $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $role = $data['role'] ?? null;

        $allowed = ['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];
        if (!in_array($role, $allowed)) {
            return $this->json(['error' => 'Invalid role.'], Response::HTTP_BAD_REQUEST);
        }

        $user->setRoles([$role]);
        $em->flush();

        return $this->json(['roles' => $user->getRoles()]);
    }

    // GET /api/admin/stats — statistiques globales
    #[Route('/stats', name: 'api_admin_stats', methods: ['GET'])]
    public function stats(
        UserRepository $userRepository,
        ResourceRepository $resourceRepository,
        StatistiqueRepository $statistiqueRepository
    ): JsonResponse {
        $totalUsers     = count($userRepository->findAll());
        $totalResources = count($resourceRepository->findAll());
        $totalViews     = array_sum(array_map(fn($s) => $s->getViews(), $statistiqueRepository->findAll()));
        $totalFavorites = array_sum(array_map(fn($s) => $s->getFavorites(), $statistiqueRepository->findAll()));

        return $this->json([
            'totalUsers'     => $totalUsers,
            'totalResources' => $totalResources,
            'totalViews'     => $totalViews,
            'totalFavorites' => $totalFavorites,
        ]);
    }

    // GET /api/admin/stats/export — export CSV
    #[Route('/stats/export', name: 'api_admin_stats_export', methods: ['GET'])]
    public function exportStats(
        ResourceRepository $resourceRepository,
        StatistiqueRepository $statistiqueRepository
    ): Response {
        $stats = $statistiqueRepository->findAll();

        $csv = "resource_id,description,views,favorites,saves,date_creation\n";
        foreach ($stats as $s) {
            $csv .= sprintf(
                "%d,%s,%d,%d,%d,%s\n",
                $s->getResource()?->getId() ?? 0,
                str_replace(',', ';', $s->getResource()?->getDescription() ?? ''),
                $s->getViews(),
                $s->getFavorites(),
                $s->getSaves(),
                $s->getDateCreation()?->format('Y-m-d')
            );
        }

        return new Response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="stats_export.csv"',
        ]);
    }

    // DELETE /api/admin/users/{id} — supprimer un utilisateur
    #[Route('/users/{id}', name: 'api_admin_delete_user', methods: ['DELETE'])]
    public function deleteUser(
        string $id,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        // Suppression logique
        $user->setDeletedAt(new \DateTime());
        $user->setStatus(false);
        $em->flush();

        return $this->json(['message' => 'User deleted.']);
    }

    // DELETE /api/admin/resources/{id} — supprimer une ressource
    #[Route('/resources/{id}', name: 'api_admin_delete_resource', methods: ['DELETE'])]
    public function deleteResource(
        int $id,
        ResourceRepository $resourceRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($id);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $em->remove($resource);
        $em->flush();

        return $this->json(['message' => 'Resource deleted permanently.']);
    }

    // PATCH /api/admin/resources/{id}/category — changer la catégorie
    #[Route('/resources/{id}/category', name: 'api_admin_change_category', methods: ['PATCH'])]
    public function changeCategory(
        int $id,
        Request $request,
        ResourceRepository $resourceRepository,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $resource = $resourceRepository->find($id);
        if (!$resource) {
            return $this->json(['error' => 'Resource not found.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $categoryId = $data['categoryId'] ?? null;

        if (!$categoryId) {
            return $this->json(['error' => 'categoryId is required.'], Response::HTTP_BAD_REQUEST);
        }

        $category = $categoryRepository->find($categoryId);
        if (!$category) {
            return $this->json(['error' => 'Category not found.'], Response::HTTP_NOT_FOUND);
        }

        $resource->setCategory($category);
        $em->flush();

        return $this->json(['message' => 'Category updated.', 'category' => $category->getName()]);
    }

    // GET /api/admin/resources — liste de toutes les ressources avec stats
    #[Route('/resources', name: 'api_admin_resources_list', methods: ['GET'])]
    public function resourcesList(ResourceRepository $resourceRepository): JsonResponse
    {
        $resources = $resourceRepository->findBy([], ['dateCreation' => 'DESC']);

        $data = array_map(fn($r) => [
            'id'          => $r->getId(),
            'description' => $r->getDescription(),
            'type'        => $r->getType()?->value,
            'status'      => $r->getStatus()?->value,
            'category'    => $r->getCategory()?->getName(),
            'categoryId'  => $r->getCategory()?->getId(),
            'author'      => $r->getUser()?->getEmail(),
            'favori'      => $r->getFavori(),
            'saved'       => $r->getSaved(),
            'views'       => $r->getStatistique()?->getViews() ?? 0,
            'dateCreation'=> $r->getDateCreation()?->format('Y-m-d'),
        ], $resources);

        return $this->json($data);
    }
}
