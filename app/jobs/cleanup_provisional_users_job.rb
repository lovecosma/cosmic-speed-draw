class CleanupProvisionalUsersJob < ApplicationJob
  queue_as :default

  def perform
    ProvisionalUser
      .where("provisional_users.created_at < ?", 7.days.ago)
      .left_joins(:drawings)
      .where(drawings: { id: nil })
      .find_each(&:destroy!)
  end
end
