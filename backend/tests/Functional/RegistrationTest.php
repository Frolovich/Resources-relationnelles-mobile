<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests fonctionnels — Registration Controller
 * Nécessite une base de données de test.
 */
class RegistrationTest extends WebTestCase
{
    public function testRegisterWithValidData(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email'                 => 'functional_test_' . uniqid() . '@test.com',
            'password'              => 'Test1234!',
            'name'                  => 'Test',
            'surname'               => 'User',
            'birthdate'             => '1990-01-01',
            'termsAccepted'         => true,
            'privacyPolicyAccepted' => true,
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('user', $data);
        $this->assertArrayHasKey('id', $data['user']);
    }

    public function testRegisterWithMissingFields(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'test@test.com',
        ]));

        $this->assertResponseStatusCodeSame(400);
    }

    public function testRegisterDuplicateEmail(): void
    {
        $client = static::createClient();
        $email  = 'duplicate_' . uniqid() . '@test.com';
        $body   = json_encode([
            'email' => $email, 'password' => 'Test1234!',
            'name' => 'A', 'surname' => 'B', 'birthdate' => '1990-01-01',
            'termsAccepted' => true, 'privacyPolicyAccepted' => true,
        ]);

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], $body);
        $this->assertResponseStatusCodeSame(201);

        // Deuxième inscription avec le même email
        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], $body);
        $this->assertResponseStatusCodeSame(409);
    }
}
