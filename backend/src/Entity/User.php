<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_ADMIN')"),
        new Get(security: "is_granted('ROLE_ADMIN') or object == user"),
        new Patch(security: "is_granted('ROLE_ADMIN') or object == user"),
        new Delete(security: "is_granted('ROLE_ADMIN') or object == user"),
    ]
)]
#[UniqueEntity(fields: ['email'], message: 'This email is already in use.')]
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\UniqueConstraint(name: 'UNIQ_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    // ========================
    // PRIMARY KEY (UUID)
    // ========================
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36, unique: true)]
    private ?string $id = null;

    // ========================
    // SECURITY
    // ========================
    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank(message: 'Email is required.')]
    #[Assert\Email(message: '"{{ value }}" is not a valid email.')]
    #[Assert\Length(max: 180, maxMessage: 'Email cannot be longer than {{ limit }} characters.')]
    private ?string $email = null;

    #[ORM\Column]
    #[Assert\NotBlank(message: 'Password is required.')]
    #[Assert\Length(min: 8, minMessage: 'Password must be at least {{ limit }} characters.')]
    private ?string $password = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $status = true;

    // ========================
    // USER INFO
    // ========================
    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Name is required.')]
    #[Assert\Length(max: 100, maxMessage: 'Name cannot be longer than {{ limit }} characters.')]
    private ?string $name = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Surname is required.')]
    #[Assert\Length(max: 100, maxMessage: 'Surname cannot be longer than {{ limit }} characters.')]
    private ?string $surname = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Assert\Length(max: 100, maxMessage: 'Nickname cannot be longer than {{ limit }} characters.')]
    private ?string $nickname = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Assert\Length(max: 100, maxMessage: 'City cannot be longer than {{ limit }} characters.')]
    private ?string $city = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $registeredAt = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Assert\LessThan('today', message: 'Birthdate must be in the past.')]
    private ?\DateTimeInterface $birthdate = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $deletedAt = null;

    // ========================
    // PASSWORD RESET
    // ========================
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $resetToken = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $resetTokenExpiresAt = null;

    // ========================
    // RGPD CONSENTS
    // ========================
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $cookiesAccepted = false;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $cookiesAcceptedAt = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Assert\IsTrue(message: 'You must accept the terms of service.')]
    private bool $termsAccepted = false;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $termsAcceptedAt = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    #[Assert\IsTrue(message: 'You must accept the privacy policy.')]
    private bool $privacyPolicyAccepted = false;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $privacyPolicyAcceptedAt = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $marketingConsent = false;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $marketingConsentAt = null;

    // ========================
    // RELATIONS
    // ========================
    #[ORM\OneToMany(targetEntity: Resource::class, mappedBy: 'user', cascade: ['remove'])]
    private Collection $resources;

    #[ORM\OneToMany(targetEntity: Comment::class, mappedBy: 'user', cascade: ['remove'])]
    private Collection $comments;

    // ========================
    // CONSTRUCTOR
    // ========================
    public function __construct()
    {
        $this->id = Uuid::v7()->toRfc4122();
        $this->roles = ['ROLE_USER'];
        $this->registeredAt = new \DateTime();
        $this->resources = new ArrayCollection();
        $this->comments = new ArrayCollection();
    }

    // ========================
    // GETTERS / SETTERS
    // ========================
    public function getId(): ?string
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
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

    public function getSurname(): ?string
    {
        return $this->surname;
    }

    public function setSurname(string $surname): static
    {
        $this->surname = $surname;
        return $this;
    }

    public function getNickname(): ?string
    {
        return $this->nickname;
    }

    public function setNickname(?string $nickname): static
    {
        $this->nickname = $nickname;
        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): static
    {
        $this->city = $city;
        return $this;
    }

    public function getBirthdate(): ?\DateTimeInterface
    {
        return $this->birthdate;
    }

    public function setBirthdate(?\DateTimeInterface $birthdate): static
    {
        $this->birthdate = $birthdate;
        return $this;
    }

    public function isStatus(): bool
    {
        return $this->status;
    }

    public function setStatus(bool $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function getDeletedAt(): ?\DateTimeInterface
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeInterface $date): static
    {
        $this->deletedAt = $date;
        return $this;
    }

    public function getRegisteredAt(): ?\DateTimeInterface
    {
        return $this->registeredAt;
    }

    public function setRegisteredAt(\DateTimeInterface $date): static
    {
        $this->registeredAt = $date;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function isCookiesAccepted(): bool
    {
        return $this->cookiesAccepted;
    }

    public function setCookiesAccepted(bool $value): static
    {
        $this->cookiesAccepted = $value;
        return $this;
    }

    public function getCookiesAcceptedAt(): ?\DateTimeInterface
    {
        return $this->cookiesAcceptedAt;
    }

    public function setCookiesAcceptedAt(?\DateTimeInterface $date): static
    {
        $this->cookiesAcceptedAt = $date;
        return $this;
    }

    public function isTermsAccepted(): bool
    {
        return $this->termsAccepted;
    }

    public function setTermsAccepted(bool $value): static
    {
        $this->termsAccepted = $value;
        return $this;
    }

    public function getTermsAcceptedAt(): ?\DateTimeInterface
    {
        return $this->termsAcceptedAt;
    }

    public function setTermsAcceptedAt(?\DateTimeInterface $date): static
    {
        $this->termsAcceptedAt = $date;
        return $this;
    }

    public function isPrivacyPolicyAccepted(): bool
    {
        return $this->privacyPolicyAccepted;
    }

    public function setPrivacyPolicyAccepted(bool $value): static
    {
        $this->privacyPolicyAccepted = $value;
        return $this;
    }

    public function getPrivacyPolicyAcceptedAt(): ?\DateTimeInterface
    {
        return $this->privacyPolicyAcceptedAt;
    }

    public function setPrivacyPolicyAcceptedAt(?\DateTimeInterface $date): static
    {
        $this->privacyPolicyAcceptedAt = $date;
        return $this;
    }

    public function isMarketingConsent(): bool
    {
        return $this->marketingConsent;
    }

    public function setMarketingConsent(bool $value): static
    {
        $this->marketingConsent = $value;
        return $this;
    }

    public function getMarketingConsentAt(): ?\DateTimeInterface
    {
        return $this->marketingConsentAt;
    }

    public function setMarketingConsentAt(?\DateTimeInterface $date): static
    {
        $this->marketingConsentAt = $date;
        return $this;
    }

    public function eraseCredentials(): void
    {
        // nothing needed
    }

    public function getResources(): Collection
    {
        return $this->resources;
    }

    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function getResetToken(): ?string { return $this->resetToken; }
    public function setResetToken(?string $token): static { $this->resetToken = $token; return $this; }
    public function getResetTokenExpiresAt(): ?\DateTimeInterface { return $this->resetTokenExpiresAt; }
    public function setResetTokenExpiresAt(?\DateTimeInterface $date): static { $this->resetTokenExpiresAt = $date; return $this; }
}
