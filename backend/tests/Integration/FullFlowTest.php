<?php

namespace App\Tests\Integration;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests d'intégration — Flux complet
 * Register → Login → Upload → Moderation → Consultation
 */
class FullFlowTest extends WebTestCase
{
    public function testCompleteUserFlow(): void
    {
        $client = static::createClient();
        $email  = 'integration_' . uniqid() . '@test.com';

        // 1. INSCRIPTION
        $client->request('POST', '/api/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => $email, 'password' => 'Test1234!',
            'name' => 'Integ', 'surname' => 'Test', 'birthdate' => '1990-01-01',
            'termsAccepted' => true, 'privacyPolicyAccepted' => true,
        ]));
        $this->assertResponseStatusCodeSame(201);

        // 2. CONNEXION
        $client->request('POST', '/api/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => $email, 'password' => 'Test1234!']));
        $this->assertResponseStatusCodeSame(200);
        $token = json_decode($client->getResponse()->getContent(), true)['token'];
        $this->assertNotEmpty($token);

        // 3. ACCÈS AU PROFIL
        $client->request('GET', '/api/me', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);
        $this->assertResponseStatusCodeSame(200);
        $me = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals($email, $me['email']);

        // 4. ACCÈS SANS TOKEN → 401
        $client->request('GET', '/api/me');
        $this->assertResponseStatusCodeSame(401);

        // 5. RESSOURCES PUBLIQUES (vide mais accessible)
        $client->request('GET', '/api/public/resources');
        $this->assertResponseStatusCodeSame(200);
    }

    public function testPasswordResetFlow(): void
    {
        $client = static::createClient();
        $email  = 'reset_' . uniqid() . '@test.com';

        // Créer un compte
        $client->request('POST', '/api/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => $email, 'password' => 'OldPass1234!',
            'name' => 'Reset', 'surname' => 'Test', 'birthdate' => '1990-01-01',
            'termsAccepted' => true, 'privacyPolicyAccepted' => true,
        ]));
        $this->assertResponseStatusCodeSame(201);

        // Demander un reset
        $client->request('POST', '/api/password/request', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => $email]));
        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertTrue($data['sent']);

        // Email inexistant → sent = false
        $client->request('POST', '/api/password/request', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['email' => 'nonexistent@test.com']));
        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertFalse($data['sent']);
    }
}
