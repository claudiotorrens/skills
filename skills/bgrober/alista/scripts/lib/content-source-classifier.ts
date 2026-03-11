/**
 * Determines if content was posted BY a place (the place's own account)
 * or ABOUT a place (a reviewer/influencer).
 *
 * This classification is crucial for extraction logic:
 * - BY_PLACE: The owner IS the place - extract owner as place
 * - ABOUT_PLACE: Extract places mentioned in content
 */

import { isSamePlaceName } from "./utils/text";
import type {
	ContentSource,
	ContentSourceClassifierInterface,
	ContentSourceSignal,
	PostMetadata,
	UrlType,
} from "./types";

export class ContentSourceClassifier implements ContentSourceClassifierInterface {
	/**
	 * Classify content source based on metadata signals
	 */
	async classify(metadata: PostMetadata, urlType: UrlType): Promise<ContentSource> {
		const signals: ContentSourceSignal[] = [];
		let byPlaceScore = 0;
		let aboutPlaceScore = 0;

		// Signal 1: Profile URL is a strong indicator of BY_PLACE
		if (urlType === "profile") {
			signals.push("profile_url");
			byPlaceScore += 0.5;
		}

		// Signal 2: Username looks like a business
		if (metadata.ownerUsername && this.isBusinessUsername(metadata.ownerUsername)) {
			signals.push("business_username");
			byPlaceScore += 0.3;
		}

		// Signal 3: Location tag matches owner username (strong BY_PLACE signal)
		if (metadata.locationName && metadata.ownerUsername) {
			if (isSamePlaceName(metadata.locationName, metadata.ownerUsername, 0.6)) {
				signals.push("location_matches_owner");
				byPlaceScore += 0.4;
			}
		}

		// Signal 4: Caption has first-person business style
		if (metadata.caption && this.hasBusinessCaptionStyle(metadata.caption)) {
			signals.push("business_caption_style");
			byPlaceScore += 0.25;
		}

		// Signal 5: Tagged users include a business account (BY_PLACE signal)
		// If a business account is tagged in the image, the post is likely about that place
		if (metadata.taggedUsers && metadata.taggedUsers.length > 0) {
			const taggedBusinesses = metadata.taggedUsers.filter((user: string) => this.isBusinessUsername(user));
			if (taggedBusinesses.length > 0) {
				signals.push("tagged_business_account");
				// Strong signal - user explicitly tagged a business in their photo
				aboutPlaceScore += 0.35;
			}
		}

		// Signal 6: @mentions of OTHER places suggest ABOUT_PLACE
		if (metadata.mentions && metadata.mentions.length > 0) {
			// Filter out self-mentions
			const otherMentions = metadata.mentions.filter(
				(m: string) => m.toLowerCase() !== metadata.ownerUsername?.toLowerCase(),
			);
			if (otherMentions.length > 0) {
				signals.push("has_place_mentions");
				aboutPlaceScore += 0.4;
			}
		}

		// Signal 6: Personal username pattern suggests ABOUT_PLACE
		if (metadata.ownerUsername && this.isPersonalUsername(metadata.ownerUsername)) {
			signals.push("personal_username_pattern");
			aboutPlaceScore += 0.3;
		}

		const type = byPlaceScore > aboutPlaceScore ? "by_place" : "about_place";
		// Confidence is the difference between scores, normalized
		const confidence = Math.min(Math.abs(byPlaceScore - aboutPlaceScore), 1);

		return { type, confidence, signals };
	}

	/**
	 * Check if a username looks like a business account
	 */
	private isBusinessUsername(username: string): boolean {
		const lower = username.toLowerCase();
		const businessPatterns = [
			// Food/drink business keywords
			/restaurant|cafe|bar|kitchen|eatery|bistro|grill|bakery|coffee|pizza|taco|burger|sushi/,
			// Common business patterns
			/^the[a-z]+$/, // "thecoffeeshop"
			/_official$/, // "placename_official"
			/hq$/, // "placehq"
			/_[a-z]{2,3}$/, // "placename_nyc"
		];
		return businessPatterns.some((p) => p.test(lower));
	}

	/**
	 * Check if a username looks like a personal account
	 */
	private isPersonalUsername(username: string): boolean {
		const lower = username.toLowerCase();
		const personalPatterns = [
			/\d{2,}$/, // Ends in 2+ numbers (john_smith99)
			/^[a-z]+_[a-z]+$/, // first_last format
			/^[a-z]+\.[a-z]+$/, // first.last format
			/foodie|eats|hungry|chef|cooks|bites|nomnom/, // Food blogger patterns
			/reviews?|critic|blogger|influencer/, // Reviewer patterns
		];
		return personalPatterns.some((p) => p.test(lower));
	}

	/**
	 * Check if caption has first-person business style
	 */
	private hasBusinessCaptionStyle(caption: string): boolean {
		const businessPhrases = [
			// First-person business voice
			/\bwe('re| are| have| just)\b/i, // "We're open", "We have new..."
			/\bour (new|menu|special|team|chef|kitchen|staff)\b/i, // "Our new..."
			// Calls to action
			/\bcome (try|visit|see|check|grab)\b/i, // "Come try..."
			/\bjoin us\b/i, // "Join us for..."
			/\bvisit us\b/i, // "Visit us at..."
			// Operational announcements
			/\bnow (open|serving|available|booking)\b/i, // "Now open..."
			/\bopen (today|now|daily|for)\b/i, // "Open today..."
			/\bclosed (today|for|until)\b/i, // "Closed for..."
			// Reservation/ordering
			/\bbook (a |your )?(table|reservation)\b/i, // "Book a table"
			/\border (now|online|via|through)\b/i, // "Order now"
			/\breservation/i, // "Reservations open"
			// Specials and events
			/\bhappy hour\b/i,
			/\btonight('s| is| we)\b/i, // "Tonight's special"
			/\bthis (week|weekend|month)\b/i, // "This weekend..."
			/\bspecial(s)?\b/i, // "Today's special"
			// Brand voice
			/\bfollow us\b/i, // "Follow us for..."
			/\blink in bio\b/i, // "Link in bio"
			/\bdm (us|for)\b/i, // "DM us for..."
		];
		return businessPhrases.some((p) => p.test(caption));
	}
}
