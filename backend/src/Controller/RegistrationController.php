<?php

namespace App\Controller;

use App\Service\RegistrationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur : reçoit la requête HTTP POST /api/register et retourne la réponse JSON.
 * La logique métier est déléguée au RegistrationService.
 */
class RegistrationController extends AbstractController
{
    public function __construct(private RegistrationService $registrationService) {}

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email'], $data['password'], $data['name'], $data['surname'], $data['birthdate'])) {
            return $this->json(
                ['error' => 'Missing required fields: email, password, name, surname, birthdate'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Vérification reCAPTCHA (ignoré en dev/test)
        $appEnv = $_ENV['APP_ENV'] ?? 'dev';
        if ($appEnv !== 'dev' && $appEnv !== 'test') {
            $captchaToken = $data['captchaToken'] ?? null;
            if (!$captchaToken) {
                return $this->json(['error' => 'CAPTCHA token is missing.'], Response::HTTP_BAD_REQUEST);
            }
            $recaptchaData = json_decode(file_get_contents(
                'https://www.google.com/recaptcha/api/siteverify?secret='
                . urlencode($_ENV['RECAPTCHA_SECRET'] ?? '')
                . '&response=' . urlencode($captchaToken)
            ), true);
            if (!$recaptchaData['success']) {
                return $this->json(['error' => 'CAPTCHA validation failed.'], Response::HTTP_BAD_REQUEST);
            }
        }

        if ($this->registrationService->emailExists($data['email'])) {
            return $this->json(['error' => 'User with this email already exists'], Response::HTTP_CONFLICT);
        }

        $result = $this->registrationService->registerUser($data);

        if (isset($result['errors'])) {
            return $this->json(['error' => 'Validation failed', 'details' => $result['errors']], Response::HTTP_BAD_REQUEST);
        }

        $user = $result['user'];

        return $this->json([
            'message' => 'User registered successfully',
            'user'    => [
                'id'      => $user->getId(),
                'email'   => $user->getEmail(),
                'name'    => $user->getName(),
                'surname' => $user->getSurname(),
            ],
        ], Response::HTTP_CREATED);
    }
}
