<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HomeControllerTest extends WebTestCase
{
    public function testPublicResourcesEndpoint(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/public/resources');

        self::assertResponseIsSuccessful();
    }
}
