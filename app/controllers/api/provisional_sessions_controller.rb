class Api::ProvisionalSessionsController < ApplicationController
  # How long after a provisional token expires a user can still recover their
  # drawings. Beyond this window the old record is treated as abandoned.
  GRACE_PERIOD = 30.days

  def create
    if (provisional_user = resolve_provisional_user)
      return issue_provisional_session_for(provisional_user)
    end

    provisional_user = ProvisionalUser.create!(last_seen_at: Time.current)
    AuthSessionService.new(request:, response:).issue_for_provisional(provisional_user)
    render json: { user: { id: provisional_user.id, email: nil, provisional: true } }, status: :created
  end

  private

  # Single JWT decode that handles both live and expired tokens. Expired tokens
  # are accepted when last_seen_at is within a 30-day grace period, so a user
  # who lets their 7-day token lapse can still recover their drawings. Beyond 30
  # days (or if the record has already been cleaned up by the job) a fresh
  # provisional user is created.
  def resolve_provisional_user
    token = bearer_token_from(request)
    return unless token

    payload = JwtService.decode(token, verify_expiration: false)
    return unless payload&.fetch("type", nil) == "provisional"

    provisional_user = ProvisionalUser.find_by(id: payload["sub"])
    return unless provisional_user

    token_live = payload["exp"] > Time.current.to_i
    return provisional_user if token_live
    provisional_user if provisional_user.last_seen_at >= GRACE_PERIOD.ago
  end

  def issue_provisional_session_for(provisional_user)
    provisional_user.touch(:last_seen_at)
    AuthSessionService.new(request:, response:).issue_for_provisional(provisional_user)
    render json: { user: { id: provisional_user.id, email: nil, provisional: true } }
  end
end
