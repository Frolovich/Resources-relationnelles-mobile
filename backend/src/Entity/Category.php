<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\CategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(),                                          // GET  /api/categories        — tous
        new Get(),                                                    // GET  /api/categories/{id}   — un
        new Post(security: "is_granted('ROLE_ADMIN')"),               // POST — admin seulement
        new Patch(security: "is_granted('ROLE_ADMIN')"),              // PATCH — admin seulement
        new Delete(security: "is_granted('ROLE_ADMIN')"),             // DELETE — admin seulement
    ]
)]
#[ORM\Entity(repositoryClass: CategoryRepository::class)]
#[ORM\Table(name: 'categories')]
class Category
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Category name is required.')]
    #[Assert\Length(max: 100, maxMessage: 'Name cannot be longer than {{ limit }} characters.')]
    private ?string $name = null;

    #[ORM\OneToMany(targetEntity: Resource::class, mappedBy: 'category')]
    private Collection $resources;

    public function __construct()
    {
        $this->resources = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getResources(): Collection
    {
        return $this->resources;
    }

    public function addResource(Resource $resource): static
    {
        if (!$this->resources->contains($resource)) {
            $this->resources->add($resource);
            $resource->setCategory($this);
        }
        return $this;
    }

    public function removeResource(Resource $resource): static
    {
        if ($this->resources->removeElement($resource)) {
            if ($resource->getCategory() === $this) {
                $resource->setCategory(null);
            }
        }
        return $this;
    }
}
