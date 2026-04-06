require "rails_helper"

RSpec.describe CleanupProvisionalUsersJob, type: :job do
  describe "#perform" do
    let(:cutoff) { 7.days.ago }

    it "destroys provisional users older than 7 days with no drawings" do
      user = create(:user, :provisional, created_at: cutoff - 1.second)
      described_class.perform_now
      expect(User.exists?(user.id)).to be false
    end

    it "does not destroy provisional users newer than 7 days" do
      user = create(:user, :provisional, created_at: cutoff + 1.second)
      described_class.perform_now
      expect(User.exists?(user.id)).to be true
    end

    it "does not destroy provisional users that have drawings" do
      user = create(:user, :provisional, created_at: cutoff - 1.second)
      create(:drawing, user: user)
      described_class.perform_now
      expect(User.exists?(user.id)).to be true
    end

    it "does not destroy real users" do
      user = create(:user, created_at: cutoff - 1.second)
      described_class.perform_now
      expect(User.exists?(user.id)).to be true
    end

    it "destroys only the eligible users" do
      eligible = create(:user, :provisional, created_at: cutoff - 1.second)
      with_drawing = create(:user, :provisional, created_at: cutoff - 1.second)
      create(:drawing, user: with_drawing)
      too_recent = create(:user, :provisional, created_at: cutoff + 1.second)

      described_class.perform_now

      expect(User.exists?(eligible.id)).to be false
      expect(User.exists?(with_drawing.id)).to be true
      expect(User.exists?(too_recent.id)).to be true
    end
  end
end
