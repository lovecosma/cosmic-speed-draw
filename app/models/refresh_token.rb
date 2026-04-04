class RefreshToken < ApplicationRecord
  EXPIRY = 30.days
  COOKIE_NAME = "refresh_token"

  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.generate_for(user)
    create!(
      user: user,
      token: SecureRandom.urlsafe_base64(32),
      expires_at: EXPIRY.from_now
    )
  end

  def revoke!
    update!(revoked_at: Time.current)
  end

  def active?
    revoked_at.nil? && expires_at > Time.current
  end
end
