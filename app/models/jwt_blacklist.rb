class JwtBlacklist < ApplicationRecord
  self.table_name = "jwt_blacklists"

  validates :jti, presence: true, uniqueness: true
  validates :exp, presence: true
end
