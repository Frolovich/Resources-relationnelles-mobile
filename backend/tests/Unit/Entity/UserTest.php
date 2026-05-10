<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitaires — Entity User
 * Pas de base de données, pas de serveur.
 */
class UserTest extends TestCase
{
    public function testNewUserHasUuid(): void
    {
        $user = new User();
        $this->assertNotNull($user->getId());
        $this->assertMatchesRegularExpression('/^[0-9a-f\-]{36}$/', $user->getId());
    }

    public function testDefaultRoleIsUser(): void
    {
        $user = new User();
        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testSetEmail(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');
        $this->assertEquals('test@example.com', $user->getEmail());
        $this->assertEquals('test@example.com', $user->getUserIdentifier());
    }

    public function testSetName(): void
    {
        $user = new User();
        $user->setName('Jean');
        $user->setSurname('Dupont');
        $this->assertEquals('Jean', $user->getName());
        $this->assertEquals('Dupont', $user->getSurname());
    }

    public function testStatusDefaultTrue(): void
    {
        $user = new User();
        $this->assertTrue($user->isStatus());
    }

    public function testDeactivateUser(): void
    {
        $user = new User();
        $user->setStatus(false);
        $this->assertFalse($user->isStatus());
    }

    public function testSoftDelete(): void
    {
        $user = new User();
        $this->assertFalse($user->isDeleted());
        $user->setDeletedAt(new \DateTime());
        $this->assertTrue($user->isDeleted());
    }

    public function testSetRoles(): void
    {
        $user = new User();
        $user->setRoles(['ROLE_ADMIN']);
        $this->assertContains('ROLE_ADMIN', $user->getRoles());
        $this->assertContains('ROLE_USER', $user->getRoles()); // toujours présent
    }

    public function testRegisteredAtIsSet(): void
    {
        $user = new User();
        $this->assertNotNull($user->getRegisteredAt());
        $this->assertInstanceOf(\DateTimeInterface::class, $user->getRegisteredAt());
    }

    public function testResetToken(): void
    {
        $user = new User();
        $this->assertNull($user->getResetToken());
        $user->setResetToken('abc123');
        $this->assertEquals('abc123', $user->getResetToken());
        $user->setResetToken(null);
        $this->assertNull($user->getResetToken());
    }

    public function testRgpdConsents(): void
    {
        $user = new User();
        $this->assertFalse($user->isTermsAccepted());
        $user->setTermsAccepted(true);
        $user->setTermsAcceptedAt(new \DateTime());
        $this->assertTrue($user->isTermsAccepted());
        $this->assertNotNull($user->getTermsAcceptedAt());
    }
}
