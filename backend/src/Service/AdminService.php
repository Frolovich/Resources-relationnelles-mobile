<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\CategoryRepository;
use App\Repository\ResourceRepository;
use App\Repository\StatistiqueRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Service : porte l'intelligence fonctionnelle de l'administration.
 * Gestion des utilisateurs, des ressources, des statistiques.
 */
class AdminService
{
    public function __construct(
        private UserRepository $userRepository,
        private ResourceRepository $resourceRepository,
        private CategoryRepository $categoryRepository,
        private StatistiqueRepository $statistiqueRepository,
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    public function getAllUsers(): array
    {
        return array_map(fn($u) => [
            'id'           => $u->getId(),
            'email'        => $u->getEmail(),
            'name'         => $u->getName(),
            'surname'      => $u->getSurname(),
            'roles'        => $u->getRoles(),
            'status'       => $u->isStatus(),
            'registeredAt' => $u->getRegisteredAt()?->format('Y-m-d'),
        ], $this->userRepository->findAll());
    }

    public function toggleUserStatus(string $id): array
    {
        $user = $this->userRepository->find($id);
        if (!$user) return ['error' => 'User not found.', 'code' => 404];

        $user->setStatus(!$user->isStatus());
        $this->em->flush();

        return ['status' => $user->isStatus()];
    }

    public function changeUserRole(string $id, string $role): array
    {
        $allowed = ['ROLE_USER', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];
        if (!in_array($role, $allowed)) {
            return ['error' => 'Invalid role.', 'code' => 400];
        }

        $user = $this->userRepository->find($id);
        if (!$user) return ['error' => 'User not found.', 'code' => 404];

        $user->setRoles([$role]);
        $this->em->flush();

        return ['roles' => $user->getRoles()];
    }

    public function deleteUser(string $id): array
    {
        $user = $this->userRepository->find($id);
        if (!$user) return ['error' => 'User not found.', 'code' => 404];

        // Suppression logique
        $user->setDeletedAt(new \DateTime());
        $user->setStatus(false);
        $this->em->flush();

        return ['success' => true];
    }

    public function getStats(): array
    {
        $stats = $this->statistiqueRepository->findAll();

        return [
            'totalUsers'     => count($this->userRepository->findAll()),
            'totalResources' => count($this->resourceRepository->findAll()),
            'totalViews'     => array_sum(array_map(fn($s) => $s->getViews(), $stats)),
            'totalFavorites' => array_sum(array_map(fn($s) => $s->getFavorites(), $stats)),
        ];
    }

    public function getStatsAsCsv(): string
    {
        $stats = $this->statistiqueRepository->findAll();
        $csv   = "resource_id,description,views,favorites,saves,date_creation\n";

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

        return $csv;
    }

    public function getAllResources(): array
    {
        return array_map(fn($r) => [
            'id'           => $r->getId(),
            'description'  => $r->getDescription(),
            'type'         => $r->getType()?->value,
            'status'       => $r->getStatus()?->value,
            'category'     => $r->getCategory()?->getName(),
            'categoryId'   => $r->getCategory()?->getId(),
            'author'       => $r->getUser()?->getEmail(),
            'favori'       => $r->getFavori(),
            'saved'        => $r->getSaved(),
            'views'        => $r->getStatistique()?->getViews() ?? 0,
            'dateCreation' => $r->getDateCreation()?->format('Y-m-d'),
        ], $this->resourceRepository->findBy([], ['dateCreation' => 'DESC']));
    }

    public function deleteResource(int $id): array
    {
        $resource = $this->resourceRepository->find($id);
        if (!$resource) return ['error' => 'Resource not found.', 'code' => 404];

        $this->em->remove($resource);
        $this->em->flush();

        return ['success' => true];
    }

    public function changeResourceCategory(int $id, int $categoryId): array
    {
        $resource = $this->resourceRepository->find($id);
        if (!$resource) return ['error' => 'Resource not found.', 'code' => 404];

        $category = $this->categoryRepository->find($categoryId);
        if (!$category) return ['error' => 'Category not found.', 'code' => 404];

        $resource->setCategory($category);
        $this->em->flush();

        return ['category' => $category->getName()];
    }

    public function createAccount(array $data): array
    {
        if ($this->userRepository->findOneBy(['email' => $data['email']])) {
            return ['error' => 'Email already exists.', 'code' => 409];
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name']);
        $user->setSurname($data['surname']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));
        $user->setRoles([$data['role'] ?? 'ROLE_MODERATOR']);
        $user->setTermsAccepted(true);
        $user->setPrivacyPolicyAccepted(true);

        $this->em->persist($user);
        $this->em->flush();

        return ['user' => $user];
    }
}
