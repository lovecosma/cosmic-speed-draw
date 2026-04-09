require "rails_helper"

RSpec.describe SessionOwner do
  let(:bare_controller) do
    Class.new(ActionController::API) do
      include SessionOwner
    end
  end

  it "provides bearer_token_from without requiring the host to include BearerTokenRequest separately" do
    expect(bare_controller.private_instance_methods).to include(:bearer_token_from)
  end
end
