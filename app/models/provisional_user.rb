class ProvisionalUser < ApplicationRecord
  has_many :drawings, foreign_key: :provisional_user_id, dependent: :destroy
end
