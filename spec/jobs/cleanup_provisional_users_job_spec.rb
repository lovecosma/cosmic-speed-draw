require "rails_helper"

RSpec.describe CleanupProvisionalUsersJob, type: :job do
  describe "#perform" do
    let(:cutoff) { described_class::RETENTION_PERIOD.ago }

    it "destroys provisional users not seen for more than 7 days" do
      user = create(:provisional_user, last_seen_at: cutoff - 1.second)
      described_class.perform_now
      expect(ProvisionalUser.exists?(user.id)).to be false
    end

    it "destroys stale provisional users that still have drawings" do
      user = create(:provisional_user, last_seen_at: cutoff - 1.second)
      create(:drawing, :provisional, provisional_user: user)
      described_class.perform_now
      expect(ProvisionalUser.exists?(user.id)).to be false
    end

    it "preserves provisional users seen within the last 7 days" do
      user = create(:provisional_user, last_seen_at: cutoff + 1.second)
      described_class.perform_now
      expect(ProvisionalUser.exists?(user.id)).to be true
    end

    it "destroys only eligible provisional users" do
      eligible    = create(:provisional_user, last_seen_at: cutoff - 1.second)
      has_drawing = create(:provisional_user, last_seen_at: cutoff - 1.second)
      too_recent  = create(:provisional_user, last_seen_at: cutoff + 1.second)
      create(:drawing, :provisional, provisional_user: has_drawing)

      described_class.perform_now

      expect(ProvisionalUser.exists?(eligible.id)).to be false
      expect(ProvisionalUser.exists?(has_drawing.id)).to be false
      expect(ProvisionalUser.exists?(too_recent.id)).to be true
    end
  end
end
