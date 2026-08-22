<?php

namespace App\Service;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Service : porte l'intelligence fonctionnelle de la réinitialisation de mot de passe.
 * Génération du token sécurisé, envoi d'email, validation, mise à jour du mot de passe.
 */
class PasswordResetService
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $em,
        private MailerInterface $mailer,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    /**
     * Génère un token et envoie l'email de réinitialisation.
     *
     * @return array{sent: bool}|array{error: string}
     */
    public function requestReset(string $email): array
    {
        $user = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            return ['sent' => false];
        }

        $token     = bin2hex(random_bytes(32));
        $expiresAt = new \DateTime('+1 hour');

        $user->setResetToken($token);
        $user->setResetTokenExpiresAt($expiresAt);
        $this->em->flush();

        $resetUrl = 'http://localhost:3002/reset-password?token=' . $token;
        $fromAddr = $_ENV['MAILER_FROM'] ?? 'noreply@ressources-relationnelles.fr';

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
                    <p style="color: #475569; font-size: 12px;">Ou copiez ce lien :<br><code style="color: #60a5fa;">%s</code></p>
                </div>
            ', $user->getName(), $resetUrl, $resetUrl));

        try {
            $this->mailer->send($emailMessage);
        } catch (\Exception $e) {
            return ['error' => 'Mail error: ' . $e->getMessage()];
        }

        return ['sent' => true];
    }

    /**
     * Valide le token et met à jour le mot de passe.
     *
     * @return array{success: true}|array{error: string}
     */
    public function resetPassword(string $token, string $newPassword): array
    {
        if (strlen($newPassword) < 8) {
            return ['error' => 'Password must be at least 8 characters.'];
        }

        $user = $this->userRepository->findOneBy(['resetToken' => $token]);

        if (!$user) {
            return ['error' => 'Invalid or expired token.'];
        }

        if ($user->getResetTokenExpiresAt() < new \DateTime()) {
            return ['error' => 'Token has expired. Please request a new one.'];
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
        $user->setResetToken(null);
        $user->setResetTokenExpiresAt(null);
        $this->em->flush();

        return ['success' => true];
    }
}
