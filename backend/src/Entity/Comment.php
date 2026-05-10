<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\CommentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(),                                                          // GET  /api/comments        — tous
        new Get(),                                                                    // GET  /api/comments/{id}   — un
        new Post(security: "is_granted('ROLE_USER')"),                                // POST — utilisateur connecté
        new Patch(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"),  // PATCH — auteur ou admin
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"), // DELETE — auteur ou admin
    ]
)]
#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ORM\Table(name: 'comments')]
class Comment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    #[Assert\NotNull(message: 'User is required.')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Resource::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(name: 'resource_id', referencedColumnName: 'id', nullable: false)]
    #[Assert\NotNull(message: 'Resource is required.')]
    private ?Resource $resource = null;

    #[ORM\Column(length: 20, enumType: CommentStatus::class, options: ['default' => 'pending'])]
    private CommentStatus $status = CommentStatus::PENDING;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\NotBlank(message: 'Comment content cannot be empty.')]
    #[Assert\Length(min: 2, minMessage: 'Comment must be at least {{ limit }} characters.')]
    private ?string $content = null;

    public function __construct()
    {
        $this->date = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
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

    public function getStatus(): CommentStatus
    {
        return $this->status;
    }

    public function setStatus(CommentStatus $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;
        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;
        return $this;
    }
}
