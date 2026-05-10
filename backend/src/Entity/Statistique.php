<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\StatistiqueRepository;
use Doctrine\ORM\Mapping as ORM;

#[ApiResource(
    operations: [
        new GetCollection(),  // GET /api/statistiques        — tous
        new Get(),            // GET /api/statistiques/{id}   — un
        // Pas de POST/PATCH/DELETE — les stats sont gérées en interne
    ]
)]
#[ORM\Entity(repositoryClass: StatistiqueRepository::class)]
#[ORM\Table(name: 'statistiques')]
class Statistique
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Resource::class, inversedBy: 'statistique')]
    #[ORM\JoinColumn(name: 'resource_id', referencedColumnName: 'id', nullable: false)]
    private ?Resource $resource = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $dateCreation = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $views = 0;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $favorites = 0;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $saves = 0;

    public function __construct()
    {
        $this->dateCreation = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getResource(): ?Resource
    {
        return $this->resource;
    }

    public function setResource(?Resource $resource): static
    {
        $this->resource = $resource;
        return $this;
    }

    public function getDateCreation(): ?\DateTimeInterface
    {
        return $this->dateCreation;
    }

    public function setDateCreation(\DateTimeInterface $dateCreation): static
    {
        $this->dateCreation = $dateCreation;
        return $this;
    }

    public function getViews(): int
    {
        return $this->views;
    }

    public function setViews(int $views): static
    {
        $this->views = $views;
        return $this;
    }

    public function getFavorites(): int
    {
        return $this->favorites;
    }

    public function setFavorites(int $favorites): static
    {
        $this->favorites = $favorites;
        return $this;
    }

    public function getSaves(): int
    {
        return $this->saves;
    }

    public function setSaves(int $saves): static
    {
        $this->saves = $saves;
        return $this;
    }
}
