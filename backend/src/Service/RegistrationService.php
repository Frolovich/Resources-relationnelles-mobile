<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Service : porte l'intelligence fonctionnelle de l'inscription.
 * Création de l'utilisateur, hashage du mot de passe, consentements RGPD, validation.
 */
class RegistrationService
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
        private UserRepository $userRepository,
    ) {}

    public function emailExists(string $email): bool
    {
        return $this->userRepository->findOneBy(['email' => $email]) !== null;
    }

    /**
     * @return array{user: User}|array{errors: array}
     */
    public function registerUser(array $data): array
    {
        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name']);
        $user->setSurname($data['surname']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));

        try {
            $user->setBirthdate(new \DateTime($data['birthdate']));
        } catch (\Exception) {
            return ['errors' => ['birthdate' => 'Invalid date format. Use YYYY-MM-DD']];
        }

        if (!empty($data['nickname'])) { $user->setNickname($data['nickname']); }
        if (!empty($data['city']))     { $user->setCity($data['city']); }

        $this->applyRgpdConsents($user, $data);

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[$error->getPropertyPath()] = $error->getMessage();
            }
            return ['errors' => $messages];
        }

        $this->em->persist($user);
        $this->em->flush();

        return ['user' => $user];
    }

    private function applyRgpdConsents(User $user, array $data): void
    {
        $now = new \DateTime();
        if (!empty($data['termsAccepted']))         { $user->setTermsAccepted(true);         $user->setTermsAcceptedAt($now); }
        if (!empty($data['privacyPolicyAccepted'])) { $user->setPrivacyPolicyAccepted(true); $user->setPrivacyPolicyAcceptedAt($now); }
        if (!empty($data['cookiesAccepted']))       { $user->setCookiesAccepted(true);       $user->setCookiesAcceptedAt($now); }
        if (!empty($data['marketingConsent']))      { $user->setMarketingConsent(true);      $user->setMarketingConsentAt($now); }
    }
}
