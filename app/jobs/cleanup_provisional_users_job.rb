class CleanupProvisionalUsersJob < ApplicationJob
  queue_as :default

  # Provisional users not seen within this period are destroyed, along with
  # any drawings they own (via dependent: :destroy on the association).
  RETENTION_PERIOD = 7.days

  def perform
    ProvisionalUser
      .where("provisional_users.last_seen_at < ?", RETENTION_PERIOD.ago)
      .find_each(&:destroy!)
  end
end
