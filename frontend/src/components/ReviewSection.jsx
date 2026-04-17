import { useState, useEffect, useContext, useCallback } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { reviewService, bookingService } from "../services/api";

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="text-2xl focus:outline-none transition-transform hover:scale-110"
        >
          {star <= (hovered || value) ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <span className="text-[#C4622D]">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function relativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function ReviewSection({ serviceId }) {
  const { user } = useContext(AppContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const data = await reviewService.getReviewsByService(serviceId);
      setReviews(data);
    } catch {
      // Non-critical — silently fail
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  const checkBookingEligibility = useCallback(async () => {
    try {
      const bookings = await bookingService.getBookings();
      const confirmed = bookings.some(
        (b) => b.service_id === serviceId && b.status === "confirmed"
      );
      setHasConfirmedBooking(confirmed);
    } catch {
      // ignore
    }
  }, [serviceId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (user) checkBookingEligibility();
  }, [user, checkBookingEligibility]);

  useEffect(() => {
    if (user && reviews.length > 0) {
      const alreadyReviewed = reviews.some((r) => {
        const reviewerName =
          user.name || (user.email ? user.email.split("@")[0] : "");
        return r.user_name === reviewerName;
      });
      setHasReviewed(alreadyReviewed);
    }
  }, [reviews, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (comment.trim().length < 3) {
      toast.error("Comment must be at least 3 characters");
      return;
    }
    setSubmitting(true);
    try {
      await reviewService.createReview({
        service_id: serviceId,
        rating,
        comment: comment.trim(),
      });
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      setHasReviewed(true);
      await loadReviews();
    } catch (err) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return (
    <div className="mt-8 border-t border-[#E8D9B8] pt-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#3D2B1A]">Reviews</h2>
        {avgRating !== null && (
          <span className="text-sm text-gray-600">
            ⭐ {avgRating} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Submit form */}
      {user && hasConfirmedBooking && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-[#FAF6EF] rounded-2xl p-5 mb-6 border border-[#E8D9B8]">
          <h3 className="font-semibold text-[#3D2B1A] mb-3">Leave a Review</h3>
          <div className="mb-3">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            maxLength={1000}
            className="w-full border border-[#E8D9B8] rounded-xl p-3 text-sm focus:outline-none focus:border-[#C4622D] resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">{comment.length}/1000</span>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#C4622D" }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {user && hasReviewed && (
        <p className="text-sm text-gray-500 mb-4 italic">You have already reviewed this stay.</p>
      )}

      {user && !hasConfirmedBooking && !hasReviewed && (
        <p className="text-sm text-gray-400 mb-4 italic">
          Only guests with confirmed bookings can leave a review.
        </p>
      )}

      {/* Review list */}
      {loading && (
        <div className="py-6 text-center text-gray-400 text-sm">Loading reviews...</div>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-gray-400 text-sm italic">Be the first to review this stay.</p>
      )}

      {!loading && reviews.length > 0 && (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="pb-4 border-b border-[#E8D9B8] last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#C4622D] text-white text-sm flex items-center justify-center font-semibold flex-shrink-0">
                  {(review.user_name || "G").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#3D2B1A]">{review.user_name || "Guest"}</p>
                  <p className="text-xs text-gray-400">{relativeDate(review.created_at)}</p>
                </div>
                <div className="ml-auto">
                  <StarDisplay rating={review.rating} />
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed pl-10">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
