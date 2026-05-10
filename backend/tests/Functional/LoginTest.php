<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests fonctionnels — Login
 */
class LoginTest extends WebTestCase
{
    public function testLoginWithValidCredentials(): void
    {
        $client = static::createClient();
        $email  = 'login_test_' . uniqid() . '@test.com';

        // D'abord créer un compte
        $client->request('POST', '/api/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => $email, 'password' => 'Test1234!',
            'name' => 'Login', 'surname' => 'Test', 'birthdate' => '1990-01-01',
            'termsAccepted' => true, 'privacyPolicyAccepted' => true,
        ]));
        $this->assertResponseStatusCodeSame(201);

        // Puis se connecter
        $client->request('POST', '/api/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email'    => $email,
            'password' => 'Test1234!',
        ]));

        $this->assertResponseStatusCodeSame(200);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $data);
    }

    public function testLoginWithInvalidPassword(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email'    => 'nonexistent@test.com',
            'password' => 'WrongPassword!',
        ]));

        $this->assertResponseStatusCodeSame(401);
    }
}
