<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class RegistrationController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
        UserRepository $userRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        // Validate required fields
        if (!isset($data['email'], $data['password'], $data['name'], $data['surname'], $data['birthdate'])) {
            return $this->json([
                'error' => 'Missing required fields: email, password, name, surname, birthdate'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Verify reCAPTCHA token (skip in dev/test environment)
        $appEnv = $_ENV['APP_ENV'] ?? 'dev';
        if ($appEnv !== 'dev' && $appEnv !== 'test') {
            $captchaToken = $data['captchaToken'] ?? null;
            if (!$captchaToken) {
                return $this->json(['error' => 'CAPTCHA token is missing.'], Response::HTTP_BAD_REQUEST);
            }

            $recaptchaSecret = $_ENV['RECAPTCHA_SECRET'] ?? '';
            $recaptchaResponse = file_get_contents(
                'https://www.google.com/recaptcha/api/siteverify?secret=' . urlencode($recaptchaSecret) . '&response=' . urlencode($captchaToken)
            );
            $recaptchaData = json_decode($recaptchaResponse, true);

            if (!$recaptchaData['success']) {
                return $this->json(['error' => 'CAPTCHA validation failed. Please try again.'], Response::HTTP_BAD_REQUEST);
            }
        }

        // Check if user already exists
        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json([
                'error' => 'User with this email already exists'
            ], Response::HTTP_CONFLICT);
        }

        // Create new user
        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name']);
        $user->setSurname($data['surname']);

        // Hash password
        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        // Parse and set birthdate
        try {
            $birthdate = new \DateTime($data['birthdate']);
            $user->setBirthdate($birthdate);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Invalid birthdate format. Use YYYY-MM-DD'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Optional fields
        if (isset($data['nickname'])) {
            $user->setNickname($data['nickname']);
        }
        if (isset($data['city'])) {
            $user->setCity($data['city']);
        }

        // RGPD consents
        if (isset($data['cookiesAccepted']) && $data['cookiesAccepted']) {
            $user->setCookiesAccepted(true);
            $user->setCookiesAcceptedAt(new \DateTime());
        }
        if (isset($data['termsAccepted']) && $data['termsAccepted']) {
            $user->setTermsAccepted(true);
            $user->setTermsAcceptedAt(new \DateTime());
        }
        if (isset($data['privacyPolicyAccepted']) && $data['privacyPolicyAccepted']) {
            $user->setPrivacyPolicyAccepted(true);
            $user->setPrivacyPolicyAcceptedAt(new \DateTime());
        }
        if (isset($data['marketingConsent']) && $data['marketingConsent']) {
            $user->setMarketingConsent(true);
            $user->setMarketingConsentAt(new \DateTime());
        }

        // Validate entity
        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'error' => 'Validation failed',
                'details' => $errorMessages
            ], Response::HTTP_BAD_REQUEST);
        }

        // Save to database
        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName(),
                'surname' => $user->getSurname()
            ]
        ], Response::HTTP_CREATED);
    }
}
