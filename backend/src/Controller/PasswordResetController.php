<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class PasswordResetController extends AbstractController
{
    // POST /api/password/request
    #[Route('/api/password/request', name: 'api_password_request', methods: ['POST'])]
    public function request(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        MailerInterface $mailer
    ): JsonResponse {
        $data  = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->json(['error' => 'Email is required.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['email' => $email]);

        // Toujours retourner 200 pour ne pas révéler si l'email existe
        if (!$user) {
            return $this->json(['message' => 'If this email exists, a reset link has been sent.', 'sent' => false]);
        }

        // Générer un token sécurisé (valable 1 heure)
        $token     = bin2hex(random_bytes(32));
        $expiresAt = new \DateTime('+1 hour');

        $user->setResetToken($token);
        $user->setResetTokenExpiresAt($expiresAt);
        $em->flush();

        $resetUrl = 'http://localhost:3002/reset-password?token=' . $token;
        $fromAddr = $_ENV['MAILER_FROM'] ?? 'noreply@ressources-relationnelles.fr';

        // Envoyer l'email
        $emailMessage = (new Email())
            ->from($fromAddr)
            ->to($user->getEmail())
            ->subject('Réinitialisation de votre mot de passe — (Re)Sources Relationnelles')
            ->html(sprintf('
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 32px; border-radius: 12px;">
                    <h1 style="color: #60a5fa; font-size: 22px;">Réinitialisation de mot de passe</h1>
                    <p>Bonjour <strong>%s</strong>,</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>(Re)Sources Relationnelles</strong>.</p>
                    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="%s" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Réinitialiser mon mot de passe
                        </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">Ce lien est valable pendant <strong>1 heure</strong>.</p>
                    <p style="color: #94a3b8; font-size: 13px;">Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                    <hr style="border-color: #334155; margin: 24px 0;">
                    <p style="color: #475569; font-size: 12px;">Ou copiez ce lien dans votre navigateur :<br><code style="color: #60a5fa;">%s</code></p>
                </div>
            ', $user->getName(), $resetUrl, $resetUrl));

        try {
            $mailer->send($emailMessage);
        } catch (\Exception $e) {
            // Retourner l'erreur en dev pour debug
            return $this->json([
                'error' => 'Mail error: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(['message' => 'If this email exists, a reset link has been sent.', 'sent' => true]);
    }

    // POST /api/password/reset
    #[Route('/api/password/reset', name: 'api_password_reset', methods: ['POST'])]
    public function reset(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data        = json_decode($request->getContent(), true);
        $token       = $data['token'] ?? null;
        $newPassword = $data['password'] ?? null;

        if (!$token || !$newPassword) {
            return $this->json(['error' => 'Token and password are required.'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($newPassword) < 8) {
            return $this->json(['error' => 'Password must be at least 8 characters.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['resetToken' => $token]);

        if (!$user) {
            return $this->json(['error' => 'Invalid or expired token.'], Response::HTTP_BAD_REQUEST);
        }

        if ($user->getResetTokenExpiresAt() < new \DateTime()) {
            return $this->json(['error' => 'Token has expired. Please request a new one.'], Response::HTTP_BAD_REQUEST);
        }

        $hashed = $passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashed);
        $user->setResetToken(null);
        $user->setResetTokenExpiresAt(null);
        $em->flush();

        return $this->json(['message' => 'Password updated successfully. You can now log in.']);
    }
}
