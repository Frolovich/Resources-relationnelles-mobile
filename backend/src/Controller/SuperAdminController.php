<?php

namespace App\Controller;

use App\Repository\ModerationLogRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\User;

#[Route('/api/super-admin')]
class SuperAdminController extends AbstractController
{
    // PATCH /api/super-admin/users/{id}/role — changer le rôle (admin/moderator)
    #[Route('/users/{id}/role', name: 'api_superadmin_change_role', methods: ['PATCH'])]
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

        return $this->json(['message' => 'Role updated.', 'roles' => $user->getRoles()]);
    }

    // GET /api/super-admin/users — liste complète avec rôles
    #[Route('/users', name: 'api_superadmin_users', methods: ['GET'])]
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

    // GET /api/super-admin/logs — journal de modération
    #[Route('/logs', name: 'api_superadmin_logs', methods: ['GET'])]
    public function logs(ModerationLogRepository $logRepository): JsonResponse
    {
        $logs = $logRepository->findBy([], ['createdAt' => 'DESC'], 100);
        $data = array_map(fn($l) => [
            'id'        => $l->getId(),
            'action'    => $l->getAction(),
            'reason'    => $l->getReason(),
            'moderator' => $l->getModerator()?->getEmail(),
            'resource'  => $l->getResource()?->getId(),
            'comment'   => $l->getComment()?->getId(),
            'targetUser'=> $l->getTargetUser()?->getEmail(),
            'createdAt' => $l->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $logs);
        return $this->json($data);
    }

    // POST /api/super-admin/create-account — créer un compte admin/moderator
    #[Route('/create-account', name: 'api_superadmin_create_account', methods: ['POST'])]
    public function createAccount(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $email    = $data['email'] ?? null;
        $name     = $data['name'] ?? null;
        $surname  = $data['surname'] ?? null;
        $password = $data['password'] ?? null;
        $role     = $data['role'] ?? 'ROLE_MODERATOR';

        if (!$email || !$name || !$surname || !$password) {
            return $this->json(['error' => 'All fields are required.'], Response::HTTP_BAD_REQUEST);
        }

        if ($userRepository->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'Email already exists.'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setName($name);
        $user->setSurname($surname);
        $user->setPassword($passwordHasher->hashPassword($user, $password));
        $user->setRoles([$role]);
        $user->setTermsAccepted(true);
        $user->setPrivacyPolicyAccepted(true);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'Account created.',
            'user'    => ['id' => $user->getId(), 'email' => $user->getEmail(), 'roles' => $user->getRoles()],
        ], Response::HTTP_CREATED);
    }
}
