<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\ResourceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(),                                                        // GET  /api/resources        — tous (public)
        new Get(),                                                                  // GET  /api/resources/{id}   — un (public)
        new Post(security: "is_granted('ROLE_USER')"),                              // POST — utilisateur connecté
        new Patch(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"), // PATCH — auteur ou admin
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getUser() == user"), // DELETE — auteur ou admin
    ]
)]
#[ORM\Entity(repositoryClass: ResourceRepository::class)]
#[ORM\Table(name: 'resources')]
class Resource
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'resources')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    #[Assert\NotNull(message: 'User is required.')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Category::class, inversedBy: 'resources')]
    #[ORM\JoinColumn(name: 'category_id', referencedColumnName: 'id', nullable: false)]
    #[Assert\NotNull(message: 'Category is required.')]
    private ?Category $category = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    #[Assert\PositiveOrZero(message: 'Popular count must be zero or positive.')]
    private int $popular = 0;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    #[Assert\PositiveOrZero(message: 'Favori count must be zero or positive.')]
    private int $favori = 0;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    #[Assert\PositiveOrZero(message: 'Saved count must be zero or positive.')]
    private int $saved = 0;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Assert\NotBlank(message: 'Content is required.')]
    private ?string $content = null;

    #[ORM\Column(length: 10, enumType: ResourceType::class)]
    #[Assert\NotNull(message: 'Type is required.')]
    private ?ResourceType $type = null;

    #[ORM\Column(length: 20, enumType: ResourceStatus::class, options: ['default' => 'pending'])]
    private ResourceStatus $status = ResourceStatus::PENDING;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $restreint = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $dateCreation = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $datePublication = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $deletedAt = null;

    #[ORM\OneToMany(targetEntity: Comment::class, mappedBy: 'resource', cascade: ['remove'])]
    private Collection $comments;

    #[ORM\OneToOne(targetEntity: Statistique::class, mappedBy: 'resource', cascade: ['persist', 'remove'])]
    private ?Statistique $statistique = null;

    public function __construct()
    {
        $this->dateCreation = new \DateTime();
        $this->comments = new ArrayCollection();
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

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;
        return $this;
    }

    public function getPopular(): int
    {
        return $this->popular;
    }

    public function setPopular(int $popular): static
    {
        $this->popular = $popular;
        return $this;
    }

    public function getFavori(): int
    {
        return $this->favori;
    }

    public function setFavori(int $favori): static
    {
        $this->favori = $favori;
        return $this;
    }

    public function getSaved(): int
    {
        return $this->saved;
    }

    public function setSaved(int $saved): static
    {
        $this->saved = $saved;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
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

    public function getType(): ?ResourceType
    {
        return $this->type;
    }

    public function setType(ResourceType $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getStatus(): ResourceStatus
    {
        return $this->status;
    }

    public function setStatus(ResourceStatus $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function isRestreint(): ?bool
    {
        return $this->restreint;
    }

    public function setRestreint(?bool $restreint): static
    {
        $this->restreint = $restreint;
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

    public function getDatePublication(): ?\DateTimeInterface
    {
        return $this->datePublication;
    }

    public function setDatePublication(?\DateTimeInterface $datePublication): static
    {
        $this->datePublication = $datePublication;
        return $this;
    }

    public function getDeletedAt(): ?\DateTimeInterface
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeInterface $deletedAt): static
    {
        $this->deletedAt = $deletedAt;
        return $this;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function addComment(Comment $comment): static
    {
        if (!$this->comments->contains($comment)) {
            $this->comments->add($comment);
            $comment->setResource($this);
        }
        return $this;
    }

    public function removeComment(Comment $comment): static
    {
        if ($this->comments->removeElement($comment)) {
            if ($comment->getResource() === $this) {
                $comment->setResource(null);
            }
        }
        return $this;
    }

    public function getStatistique(): ?Statistique
    {
        return $this->statistique;
    }

    public function setStatistique(?Statistique $statistique): static
    {
        if ($statistique === null && $this->statistique !== null) {
            $this->statistique->setResource(null);
        }

        if ($statistique !== null && $statistique->getResource() !== $this) {
            $statistique->setResource($this);
        }

        $this->statistique = $statistique;
        return $this;
    }
}
