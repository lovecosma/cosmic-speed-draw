class JwtBlacklist < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Denylist

  self.table_name = "jwt_blacklists"

  validates :jti, presence: true, uniqueness: true
  validates :exp, presence: true
end
