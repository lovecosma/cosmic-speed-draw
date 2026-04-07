module BearerTokenRequest
  private

  def bearer_token_from(request)
    ActionController::HttpAuthentication::Token.token_and_options(request)&.first
  end
end
