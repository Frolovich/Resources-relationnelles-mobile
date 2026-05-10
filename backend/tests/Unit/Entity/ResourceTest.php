<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Resource;
use App\Entity\ResourceStatus;
use App\Entity\ResourceType;
use PHPUnit\Framework\TestCase;

class ResourceTest extends TestCase
{
    public function testNewResourceHasDateCreation(): void
    {
        $resource = new Resource();
        $this->assertNotNull($resource->getDateCreation());
    }

    public function testDefaultStatusIsPending(): void
    {
        $resource = new Resource();
        $resource->setStatus(ResourceStatus::PENDING);
        $this->assertEquals(ResourceStatus::PENDING, $resource->getStatus());
    }

    public function testSetType(): void
    {
        $resource = new Resource();
        $resource->setType(ResourceType::VIDEO);
        $this->assertEquals(ResourceType::VIDEO, $resource->getType());
    }

    public function testCountersStartAtZero(): void
    {
        $resource = new Resource();
        $this->assertEquals(0, $resource->getPopular());
        $this->assertEquals(0, $resource->getFavori());
        $this->assertEquals(0, $resource->getSaved());
    }

    public function testIncrementFavori(): void
    {
        $resource = new Resource();
        $resource->setFavori(5);
        $this->assertEquals(5, $resource->getFavori());
    }

    public function testSoftDelete(): void
    {
        $resource = new Resource();
        $this->assertFalse($resource->isDeleted());
        $resource->setDeletedAt(new \DateTime());
        $this->assertTrue($resource->isDeleted());
    }

    public function testSetDescription(): void
    {
        $resource = new Resource();
        $resource->setDescription('Ma vidéo');
        $this->assertEquals('Ma vidéo', $resource->getDescription());
    }
}
