class ProvisionalMigrator
  def initialize(provisional_user, real_user)
    @provisional_user = provisional_user
    @real_user = real_user
  end

  def migrate!
    return unless @provisional_user && @real_user

    ApplicationRecord.transaction do
      Drawing.where(provisional_user: @provisional_user)
             .update_all(user_id: @real_user.id, provisional_user_id: nil, updated_at: Time.current)
      @provisional_user.destroy!
    end
  end
end
