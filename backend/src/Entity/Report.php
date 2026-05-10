<?php

namespace App\Entity;

use App\Repository\ReportRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ReportRepository::class)]
#[ORM\Table(name: 'reports')]
class Report
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    // Qui signale
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'reporter_id', referencedColumnName: 'id', nullable: false)]
    private ?User $reporter = null;

    // Utilisateur signalé (optionnel)
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'reported_user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $reportedUser = null;

    // Ressource signalée (optionnel)
    #[ORM\ManyToOne(targetEntity: Resource::class)]
    #[ORM\JoinColumn(name: 'resource_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Resource $resource = null;

    // Commentaire signalé (optionnel)
    #[ORM\ManyToOne(targetEntity: Comment::class)]
    #[ORM\JoinColumn(name: 'comment_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Comment $comment = null;

    #[ORM\Column(type: 'text')]
    private string $reason = '';

    #[ORM\Column(length: 20, options: ['default' => 'pending'])]
    private string $status = 'pending'; // pending, resolved, dismissed

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $resolvedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getReporter(): ?User { return $this->reporter; }
    public function setReporter(?User $reporter): static { $this->reporter = $reporter; return $this; }
    public function getReportedUser(): ?User { return $this->reportedUser; }
    public function setReportedUser(?User $user): static { $this->reportedUser = $user; return $this; }
    public function getResource(): ?Resource { return $this->resource; }
    public function setResource(?Resource $resource): static { $this->resource = $resource; return $this; }
    public function getComment(): ?Comment { return $this->comment; }
    public function setComment(?Comment $comment): static { $this->comment = $comment; return $this; }
    public function getReason(): string { return $this->reason; }
    public function setReason(string $reason): static { $this->reason = $reason; return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }
    public function getCreatedAt(): ?\DateTimeInterface { return $this->createdAt; }
    public function getResolvedAt(): ?\DateTimeInterface { return $this->resolvedAt; }
    public function setResolvedAt(?\DateTimeInterface $date): static { $this->resolvedAt = $date; return $this; }
}
