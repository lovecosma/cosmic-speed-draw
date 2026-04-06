class Drawing < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :provisional_user, optional: true

  validate :exactly_one_owner

  private

  def exactly_one_owner
    if user.present? == provisional_user.present?
      errors.add(:base, "must belong to either a user or a provisional user, not both or neither")
    end
  end
end
