<?php

namespace App\Entity;

use App\Repository\UserResourceProgressRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserResourceProgressRepository::class)]
#[ORM\Table(name: 'user_resource_progress')]
#[ORM\UniqueConstraint(name: 'UNIQ_USER_RESOURCE_PROGRESS', fields: ['user', 'resource'])]
class UserResourceProgress
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Resource::class)]
    #[ORM\JoinColumn(name: 'resource_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Resource $resource = null;

    // Pourcentage de complétion 0-100
    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $progress = 0;

    // Marquée comme exploitée
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $exploited = false;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $exploitedAt = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
    public function getResource(): ?Resource { return $this->resource; }
    public function setResource(?Resource $resource): static { $this->resource = $resource; return $this; }
    public function getProgress(): int { return $this->progress; }
    public function setProgress(int $progress): static { $this->progress = max(0, min(100, $progress)); $this->updatedAt = new \DateTime(); return $this; }
    public function isExploited(): bool { return $this->exploited; }
    public function setExploited(bool $exploited): static {
        $this->exploited = $exploited;
        if ($exploited && !$this->exploitedAt) {
            $this->exploitedAt = new \DateTime();
        }
        $this->updatedAt = new \DateTime();
        return $this;
    }
    public function getExploitedAt(): ?\DateTimeInterface { return $this->exploitedAt; }
    public function getUpdatedAt(): ?\DateTimeInterface { return $this->updatedAt; }
}
