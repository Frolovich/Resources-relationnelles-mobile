<?php

namespace App\Entity;

use App\Repository\ModerationLogRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ModerationLogRepository::class)]
#[ORM\Table(name: 'moderation_logs')]
class ModerationLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'moderator_id', referencedColumnName: 'id', nullable: false)]
    private ?User $moderator = null;

    // Type d'action : approve_resource, refuse_resource, approve_comment, refuse_comment, delete_content, suspend_user
    #[ORM\Column(length: 50)]
    private string $action = '';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $reason = null;

    // Référence optionnelle à la ressource concernée
    #[ORM\ManyToOne(targetEntity: Resource::class)]
    #[ORM\JoinColumn(name: 'resource_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Resource $resource = null;

    // Référence optionnelle au commentaire concerné
    #[ORM\ManyToOne(targetEntity: Comment::class)]
    #[ORM\JoinColumn(name: 'comment_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Comment $comment = null;

    // Utilisateur ciblé (suspension)
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'target_user_id', referencedColumnName: 'id', nullable: true)]
    private ?User $targetUser = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getModerator(): ?User { return $this->moderator; }
    public function setModerator(?User $moderator): static { $this->moderator = $moderator; return $this; }
    public function getAction(): string { return $this->action; }
    public function setAction(string $action): static { $this->action = $action; return $this; }
    public function getReason(): ?string { return $this->reason; }
    public function setReason(?string $reason): static { $this->reason = $reason; return $this; }
    public function getResource(): ?Resource { return $this->resource; }
    public function setResource(?Resource $resource): static { $this->resource = $resource; return $this; }
    public function getComment(): ?Comment { return $this->comment; }
    public function setComment(?Comment $comment): static { $this->comment = $comment; return $this; }
    public function getTargetUser(): ?User { return $this->targetUser; }
    public function setTargetUser(?User $user): static { $this->targetUser = $user; return $this; }
    public function getCreatedAt(): ?\DateTimeInterface { return $this->createdAt; }
}
