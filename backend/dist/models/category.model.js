import mongoose, { Schema } from "mongoose";
// ============================================================
// Question Sub-Schema
// ============================================================
const questionSchema = new Schema({
    legacyId: {
        type: String,
        trim: true,
    },
    question: {
        type: String,
        required: [true, "Question text is required"],
        trim: true,
        minlength: [10, "Question must be at least 10 characters"],
        maxlength: [500, "Question cannot exceed 500 characters"],
    },
    options: {
        type: [String],
        required: [true, "Options are required"],
        validate: {
            validator: (arr) => arr.length >= 2 && arr.length <= 6,
            message: "Question must have between 2 and 6 options",
        },
    },
    correctAnswer: {
        type: Number,
        required: [true, "Correct answer index is required"],
        min: [0, "Correct answer index must be non-negative"],
    },
    difficulty: {
        type: String,
        enum: {
            values: ["easy", "medium", "hard"],
            message: "Difficulty must be easy, medium, or hard",
        },
        required: [true, "Difficulty is required"],
    },
    explanation: {
        type: String,
        trim: true,
        maxlength: [1000, "Explanation cannot exceed 1000 characters"],
    },
}, {
    _id: true,
    timestamps: true,
});
// ============================================================
// Category Schema
// ============================================================
const categorySchema = new Schema({
    legacyId: {
        type: String,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    icon: {
        type: String,
        required: [true, "Icon is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [300, "Description cannot exceed 300 characters"],
    },
    color: {
        type: String,
        required: [true, "Color class is required"],
        trim: true,
    },
    questions: {
        type: [questionSchema],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// ============================================================
// Virtuals
// ============================================================
categorySchema.virtual("totalQuestions").get(function () {
    return this.questions.length;
});
// ============================================================
// Pre-save Middleware: auto-generate slug
// ============================================================
categorySchema.pre("validate", async function (next) {
    if (this.isModified("name") || !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
        let slug = baseSlug;
        let count = 1;
        while (await mongoose.models.Category.findOne({
            slug,
            _id: { $ne: this._id },
        })) {
            slug = `${baseSlug}-${count++}`;
        }
        this.slug = slug;
    }
    next();
});
// ============================================================
// Indexes
// ============================================================
categorySchema.index({ name: "text", description: "text" });
categorySchema.index({ isActive: 1 });
export const Category = mongoose.model("Category", categorySchema);
//# sourceMappingURL=category.model.js.map