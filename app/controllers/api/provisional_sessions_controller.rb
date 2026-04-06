class Api::ProvisionalSessionsController < ApplicationController
  def create
    if (puser = provisional_user_from_request)
      return render json: { user: { id: puser.id, email: nil, provisional: true } }
    end

    puser = ProvisionalUser.create!
    AuthSessionService.new(request:, response:).issue_for_provisional(puser)
    render json: { user: { id: puser.id, email: nil, provisional: true } }, status: :created
  end
end
